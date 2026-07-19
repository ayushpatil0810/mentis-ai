import { getShareById } from "@/lib/services/share";
import { notFound } from "next/navigation";
import { ShareView } from "./share-view";

interface SharePageProps {
  params: Promise<{ id: string }>;
}

export default async function SharePage({ params }: SharePageProps) {
  const { id } = await params;
  
  try {
    const shareObj = await getShareById(id);
    if (!shareObj) {
      return notFound();
    }
    
    // Serialize dates safely
    const serializedShare = {
      id: shareObj.id,
      chatId: shareObj.chatId,
      userId: shareObj.userId,
      snapshot: shareObj.snapshot,
      viewCount: shareObj.viewCount,
      createdAt: shareObj.createdAt.toISOString(),
      updatedAt: shareObj.updatedAt.toISOString(),
    };
    
    return <ShareView share={serializedShare} />;
  } catch (error) {
    console.error("Error loading share page:", error);
    return notFound();
  }
}
