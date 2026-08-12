import * as React from "react"

import { cn } from "@/lib/utils"

type AvatarContextValue = {
  imageLoadingStatus: "idle" | "loading" | "loaded" | "error"
  setImageLoadingStatus: (status: AvatarContextValue["imageLoadingStatus"]) => void
}

const AvatarContext = React.createContext<AvatarContextValue | undefined>(undefined)

function useAvatarContext() {
  const ctx = React.useContext(AvatarContext)
  if (!ctx) {
    throw new Error("Avatar components must be used within an <Avatar>")
  }
  return ctx
}

function Avatar({
  className,
  ...props
}: React.ComponentProps<"span">) {
  const [imageLoadingStatus, setImageLoadingStatus] = React.useState<
    AvatarContextValue["imageLoadingStatus"]
  >("idle")

  return (
    <AvatarContext.Provider value={{ imageLoadingStatus, setImageLoadingStatus }}>
      <span
        data-slot="avatar"
        data-loaded={imageLoadingStatus === "loaded"}
        data-error={imageLoadingStatus === "error"}
        className={cn(
          "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full align-middle",
          className
        )}
        {...props}
      />
    </AvatarContext.Provider>
  )
}

function AvatarImage({
  className,
  onLoad,
  onError,
  ...props
}: React.ComponentProps<"img">) {
  const { setImageLoadingStatus } = useAvatarContext()

  React.useEffect(() => {
    setImageLoadingStatus("loading")
  }, [setImageLoadingStatus, props.src])

  const handleLoad: React.ReactEventHandler<HTMLImageElement> = (e) => {
    setImageLoadingStatus("loaded")
    onLoad?.(e)
  }

  const handleError: React.ReactEventHandler<HTMLImageElement> = (e) => {
    setImageLoadingStatus("error")
    onError?.(e)
  }

  return (
    <img
      data-slot="avatar-image"
      onLoad={handleLoad}
      onError={handleError}
      className={cn(
        "aspect-square h-full w-full object-cover",
        className
      )}
      {...props}
    />
  )
}

function AvatarFallback({
  className,
  delayMs,
  ...props
}: React.ComponentProps<"span"> & {
  delayMs?: number
}) {
  const { imageLoadingStatus } = useAvatarContext()
  const [delayedVisible, setDelayedVisible] = React.useState(delayMs === undefined)

  React.useEffect(() => {
    if (delayMs === undefined) return

    const timeoutId = setTimeout(() => setDelayedVisible(true), delayMs)

    return () => clearTimeout(timeoutId)
  }, [delayMs])

  if (imageLoadingStatus === "loaded") return null
  if (!delayedVisible) return null

  return (
    <span
      data-slot="avatar-fallback"
      className={cn(
        "absolute inset-0 z-0 bg-muted text-muted-foreground flex aspect-square size-full items-center justify-center font-medium select-none",
        className
      )}
      {...props}
    />
  )
}

export { Avatar, AvatarImage, AvatarFallback }
