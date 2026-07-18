"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CheckmarkCircle02Icon, InformationCircleIcon, Alert01Icon, CancelCircleIcon } from "hugeicons-react"
import { Loader } from "./loader"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <CheckmarkCircle02Icon className="mt-0.5 size-4" />,
        info: <InformationCircleIcon className="mt-0.5 size-4" />,
        warning: <Alert01Icon className="mt-0.5 size-4" />,
        error: <CancelCircleIcon className="mt-0.5 size-4" />,
        loading: <Loader size="sm" variant="circular" className="mt-0.5" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
