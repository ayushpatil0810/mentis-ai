import jsPDF from "jspdf";

interface ExportOptions {
  includeMetadata: boolean;
  includeVersions: boolean;
  includeTools: boolean;
  format: "markdown" | "pdf" | "json";
}

interface ChatData {
  id: string;
  title: string;
  model: string | null;
  systemPrompt: string | null;
  isPinned: boolean;
  isArchived: boolean;
  isShared: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  parentChatId?: string | null;
  branchPointMessageId?: string | null;
}

interface ToolInvocationData {
  toolCallId: string;
  toolName: string;
  args: Record<string, unknown>;
  state: string;
  result?: unknown;
}

interface MessageData {
  id: string;
  chatId: string;
  role: "system" | "user" | "assistant" | "data" | "tool";
  status: "pending" | "complete" | "error";
  content: string;
  parts?: unknown;
  metadata?: Record<string, unknown> | null;
  versionGroupId?: string | null;
  isActiveVersion: boolean;
  createdAt: string | Date;
  toolInvocations?: unknown[];
}

function stripEmojis(text: string): string {
  if (!text) return "";
  try {
    return text
      .replace(/\p{Extended_Pictographic}/gu, "")
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F1E6}-\u{1F1FF}]/gu, "");
  } catch {
    // Fallback if unicode property escape is not supported
    return text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F1E6}-\u{1F1FF}]/gu, "");
  }
}

export async function exportConversation(
  chat: ChatData,
  messages: MessageData[],
  options: ExportOptions
) {
  // Filter messages based on options
  let filteredMessages = [...messages];

  // If not including versions, keep only active versions
  if (!options.includeVersions) {
    filteredMessages = filteredMessages.filter((m) => m.isActiveVersion);
  }

  // If not including tools, filter out tool/data roles and remove toolInvocations from assistant messages
  if (!options.includeTools) {
    filteredMessages = filteredMessages.filter((m) => m.role !== "tool" && m.role !== "data");
  }

  const filenameBase = chat.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  if (options.format === "json") {
    const exportData = {
      exportedAt: new Date().toISOString(),
      version: "1.0.0",
      chat: options.includeMetadata
        ? chat
        : { id: chat.id, title: chat.title, createdAt: chat.createdAt },
      messages: filteredMessages.map((m) => {
        const cleanMsg: Record<string, unknown> = {
          id: m.id,
          role: m.role,
          content: m.content,
          createdAt: m.createdAt,
        };
        if (options.includeMetadata) {
          cleanMsg.status = m.status;
          cleanMsg.versionGroupId = m.versionGroupId;
          cleanMsg.isActiveVersion = m.isActiveVersion;
          cleanMsg.metadata = m.metadata;
        }
        if (options.includeTools && (m.parts || m.toolInvocations)) {
          cleanMsg.parts = m.parts;
          cleanMsg.toolInvocations = m.toolInvocations;
        }
        return cleanMsg;
      }),
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const cleanJsonString = stripEmojis(jsonString);
    const blob = new Blob([cleanJsonString], {
      type: "application/json",
    });
    triggerDownload(blob, `${filenameBase}-export.json`);
    return;
  }

  if (options.format === "markdown") {
    let md = `# ${chat.title}\n\n`;

    if (options.includeMetadata) {
      md += `> **Metadata**\n`;
      md += `> - **Created:** ${new Date(chat.createdAt).toLocaleString()}\n`;
      if (chat.model) md += `> - **Model:** \`${chat.model}\`\n`;
      if (chat.parentChatId) md += `> - **Branched From Chat:** \`${chat.parentChatId}\`\n`;
      md += `> - **Exported:** ${new Date().toLocaleString()}\n\n`;
      md += `---\n\n`;
    }

    // Group versioned messages to display alternative versions nicely if enabled
    const displayedMessageIds = new Set<string>();

    for (let i = 0; i < filteredMessages.length; i++) {
      const m = filteredMessages[i];
      if (displayedMessageIds.has(m.id)) continue;

      if (options.includeVersions && m.versionGroupId) {
        // Find all messages in this version group
        const group = filteredMessages.filter((msg) => msg.versionGroupId === m.versionGroupId);
        group.forEach((msg) => displayedMessageIds.add(msg.id));

        md += `## ${m.role === "user" ? "User" : "Assistant"} (Versions: ${group.length})\n\n`;
        group.forEach((msg, idx) => {
          md += `### Version ${idx + 1}${msg.isActiveVersion ? " (Active)" : ""}\n`;
          md += `${msg.content}\n\n`;
          
          if (options.includeTools) {
            const tools = getToolInvocations(msg);
            if (tools && tools.length > 0) {
              md += `#### Tools Used\n`;
              tools.forEach((t) => {
                md += `- **Tool:** \`${t.toolName}\` (State: \`${t.state}\`)\n`;
                md += `  - **Args:** \`${JSON.stringify(t.args)}\`\n`;
                if (t.result) {
                  md += `  - **Result:** \`${JSON.stringify(t.result)}\`\n`;
                }
              });
              md += `\n`;
            }
          }
        });
      } else {
        displayedMessageIds.add(m.id);
        const roleHeader = m.role === "user" ? "User" : m.role === "assistant" ? "Assistant" : m.role.toUpperCase();
        md += `## ${roleHeader}\n\n`;
        md += `${m.content}\n\n`;

        if (options.includeTools) {
          const tools = getToolInvocations(m);
          if (tools && tools.length > 0) {
            md += `### Tools Used\n`;
            tools.forEach((t) => {
              md += `- **Tool:** \`${t.toolName}\` (State: \`${t.state}\`)\n`;
              md += `  - **Args:** \`${JSON.stringify(t.args)}\`\n`;
              if (t.result) {
                md += `  - **Result:** \`${JSON.stringify(t.result)}\`\n`;
              }
            });
            md += `\n`;
          }
        }
      }
      md += `---\n\n`;
    }

    const cleanMd = stripEmojis(md);
    const blob = new Blob([cleanMd], { type: "text/markdown" });
    triggerDownload(blob, `${filenameBase}-export.md`);
    return;
  }

  if (options.format === "pdf") {
    const pdf = new jsPDF({
      orientation: "p",
      unit: "mm",
      format: "a4",
    });

    const marginX = 20;
    const widthX = 170; // 210 - 2 * 20
    const pageHeight = 297;
    const marginBottom = 20;
    const maxY = pageHeight - marginBottom;
    let y = 20;

    const ensureSpace = (heightNeeded: number) => {
      if (y + heightNeeded > maxY) {
        pdf.addPage();
        y = 20;
      }
    };

    // 1. Render Chat Title
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(20);
    pdf.setTextColor(24, 24, 27); // zinc-900
    const cleanTitle = stripEmojis(chat.title);
    const titleLines = pdf.splitTextToSize(cleanTitle, widthX);
    ensureSpace(titleLines.length * 8 + 4);
    pdf.text(titleLines, marginX, y);
    y += titleLines.length * 8 + 4;

    // 2. Render Metadata
    if (options.includeMetadata) {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(113, 113, 122); // zinc-500
      
      let metaText = `Created: ${new Date(chat.createdAt).toLocaleString()} | Exported: ${new Date().toLocaleString()}`;
      if (chat.model) {
        metaText += ` | Model: ${chat.model}`;
      }
      ensureSpace(12);
      pdf.text(stripEmojis(metaText), marginX, y);
      y += 6;
      
      // Separator line
      pdf.setDrawColor(228, 228, 231); // zinc-200
      pdf.setLineWidth(0.3);
      pdf.line(marginX, y, marginX + widthX, y);
      y += 10;
    }

    // 3. Render Messages
    const displayedMessageIds = new Set<string>();

    for (let i = 0; i < filteredMessages.length; i++) {
      const m = filteredMessages[i];
      if (displayedMessageIds.has(m.id)) continue;

      const renderMessageContent = (role: string, content: string, versionInfo?: string) => {
        // Strip emojis from content
        const cleanContent = stripEmojis(content);

        // Message Header
        ensureSpace(15);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(10.5);
        
        if (role === "user") {
          pdf.setTextColor(82, 82, 91); // zinc-600
          pdf.text(versionInfo ? `USER (${versionInfo})` : "USER", marginX, y);
        } else if (role === "assistant") {
          pdf.setTextColor(24, 24, 27); // zinc-900
          pdf.text(versionInfo ? `ASSISTANT (${versionInfo})` : "ASSISTANT", marginX, y);
        } else {
          pdf.setTextColor(113, 113, 122); // zinc-500
          pdf.text(versionInfo ? `${role.toUpperCase()} (${versionInfo})` : role.toUpperCase(), marginX, y);
        }
        y += 6;

        // Render message content block by block
        const parts = cleanContent.split("```");
        for (let j = 0; j < parts.length; j++) {
          const part = parts[j];
          if (j % 2 === 1) {
            // Monospace code block
            const codeLines = part.split("\n");
            // Remove language specifier if present
            if (codeLines.length > 0 && codeLines[0].trim().length < 15 && !codeLines[0].includes(" ")) {
              codeLines.shift();
            }

            pdf.setFont("courier", "normal");
            pdf.setFontSize(8.5);
            pdf.setTextColor(39, 39, 42); // zinc-800
            
            y += 2;
            for (const line of codeLines) {
              const wrappedCodeLines = pdf.splitTextToSize(line.replace(/\r$/, ""), widthX - 8);
              for (const cl of wrappedCodeLines) {
                ensureSpace(5.5);
                
                // Draw background rect
                pdf.setFillColor(244, 244, 245); // zinc-100
                pdf.rect(marginX, y - 3.8, widthX, 5.2, "F");
                
                // Left border
                pdf.setDrawColor(212, 212, 216); // zinc-300
                pdf.setLineWidth(0.3);
                pdf.line(marginX, y - 3.8, marginX, y + 1.4);
                
                pdf.text(cl, marginX + 4, y);
                y += 5;
              }
            }
            y += 4;
          } else {
            // Standard block (paragraphs, lists)
            const lines = part.split("\n");
            let currentList: string[] = [];

            const flushList = () => {
              if (currentList.length === 0) return;
              pdf.setFont("helvetica", "normal");
              pdf.setFontSize(9.5);
              pdf.setTextColor(63, 63, 70); // zinc-700

              for (const item of currentList) {
                const isNumbered = /^\d+\.\s/.test(item.trim());
                const bulletPrefix = isNumbered ? item.trim().match(/^\d+\.\s/)![0] : "• ";
                
                const cleanedItem = item.trim()
                  .replace(/^[-*]\s+/, "")
                  .replace(/^\d+\.\s+/, "")
                  .replace(/\*\*([^*]+)\*\*/g, "$1")
                  .replace(/\*([^*]+)\*/g, "$1")
                  .replace(/__([^_]+)__/g, "$1")
                  .replace(/_([^_]+)_/g, "$1")
                  .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)");

                const indent = 6;
                const wrappedLines = pdf.splitTextToSize(cleanedItem, widthX - indent);
                
                for (let idx = 0; idx < wrappedLines.length; idx++) {
                  ensureSpace(5.5);
                  if (idx === 0) {
                    pdf.text(bulletPrefix, marginX + 2, y);
                    pdf.text(wrappedLines[idx], marginX + indent + 2, y);
                  } else {
                    pdf.text(wrappedLines[idx], marginX + indent + 2, y);
                  }
                  y += 5;
                }
              }
              y += 2;
              currentList = [];
            };

            for (const line of lines) {
              const trimmed = line.trim();
              const isListItem = trimmed.startsWith("- ") || trimmed.startsWith("* ") || /^\d+\.\s/.test(trimmed);

              if (isListItem) {
                currentList.push(line);
              } else {
                flushList();
                
                if (trimmed || line === "") {
                  const cleanedParagraphText = trimmed
                    .replace(/\*\*([^*]+)\*\*/g, "$1")
                    .replace(/\*([^*]+)\*/g, "$1")
                    .replace(/__([^_]+)__/g, "$1")
                    .replace(/_([^_]+)_/g, "$1")
                    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)");

                  if (!cleanedParagraphText) {
                    y += 3;
                    continue;
                  }

                  pdf.setFont("helvetica", "normal");
                  pdf.setFontSize(9.5);
                  pdf.setTextColor(63, 63, 70); // zinc-700
                  
                  const wrappedLines = pdf.splitTextToSize(cleanedParagraphText, widthX);
                  for (const wl of wrappedLines) {
                    ensureSpace(5.5);
                    pdf.text(wl, marginX, y);
                    y += 5;
                  }
                  y += 2;
                }
              }
            }
            flushList();
          }
        }

        // Render tools if included
        if (options.includeTools) {
          const tools = getToolInvocations(m);
          if (tools && tools.length > 0) {
            for (const t of tools) {
              ensureSpace(12);
              pdf.setFont("helvetica", "bold");
              pdf.setFontSize(8.5);
              pdf.setTextColor(113, 113, 122); // zinc-500
              pdf.text(`Tool Call: ${t.toolName}`, marginX + 4, y);
              y += 4.5;

              pdf.setFont("courier", "normal");
              pdf.setFontSize(8);

              // Args
              const argsStr = `Args: ${JSON.stringify(t.args, null, 2)}`;
              const wrappedArgs = pdf.splitTextToSize(argsStr, widthX - 8);
              for (const al of wrappedArgs) {
                ensureSpace(4.5);
                pdf.setFillColor(250, 250, 250); // very light gray
                pdf.rect(marginX + 4, y - 3.2, widthX - 4, 4, "F");
                pdf.text(al, marginX + 6, y);
                y += 4;
              }

              // Result
              if (t.result) {
                const resultStr = `Result: ${JSON.stringify(t.result, null, 2)}`;
                const wrappedResult = pdf.splitTextToSize(resultStr, widthX - 8);
                for (const rl of wrappedResult) {
                  ensureSpace(4.5);
                  pdf.setFillColor(250, 250, 250);
                  pdf.rect(marginX + 4, y - 3.2, widthX - 4, 4, "F");
                  pdf.text(rl, marginX + 6, y);
                  y += 4;
                }
              }
              y += 3;
            }
          }
        }
      };

      if (options.includeVersions && m.versionGroupId) {
        const group = filteredMessages.filter((msg) => msg.versionGroupId === m.versionGroupId);
        group.forEach((msg) => displayedMessageIds.add(msg.id));

        for (let idx = 0; idx < group.length; idx++) {
          const msg = group[idx];
          const isActiveStr = msg.isActiveVersion ? "Active Version" : `Version ${idx + 1}`;
          renderMessageContent(msg.role, msg.content, isActiveStr);
        }
      } else {
        displayedMessageIds.add(m.id);
        renderMessageContent(m.role, m.content);
      }

      // Draw spacing or separator line between messages
      if (i < filteredMessages.length - 1) {
        ensureSpace(12);
        pdf.setDrawColor(244, 244, 245); // zinc-100
        pdf.setLineWidth(0.3);
        pdf.line(marginX, y, marginX + widthX, y);
        y += 8;
      }
    }

    // 4. Header & Footer Pass (Page Numbers & Titles)
    const pageCount = pdf.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      
      // Header
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(161, 161, 170); // zinc-400
      pdf.text(cleanTitle, marginX, 10);
      pdf.setDrawColor(244, 244, 245); // zinc-100
      pdf.setLineWidth(0.2);
      pdf.line(marginX, 12, marginX + widthX, 12);

      // Footer
      pdf.text(`Page ${i} of ${pageCount}`, marginX + widthX / 2, 287, { align: "center" });
    }

    pdf.save(`${filenameBase}-export.pdf`);
    return;
  }
}

function getToolInvocations(message: MessageData): ToolInvocationData[] {
  if (message.toolInvocations) {
    return message.toolInvocations as ToolInvocationData[];
  }
  if (Array.isArray(message.parts)) {
    return (message.parts as Record<string, unknown>[])
      .filter((p) => {
        const type = p.type;
        return typeof type === "string" && (type.startsWith("tool-") || type === "dynamic-tool");
      })
      .map((p) => {
        const type = p.type as string;
        const toolName = type === "dynamic-tool" ? (p.toolName as string) : type.replace(/^tool-/, "");
        return {
          toolCallId: (p.toolCallId as string) || "",
          toolName: toolName || "",
          args: (p.args as Record<string, unknown>) || (p.parameters as Record<string, unknown>) || {},
          state: (p.state as string) || "result",
          result: p.result,
        };
      });
  }
  return [];
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
