"use client"

import { useState } from "react"
import { AlertCircle, CheckCircle2 } from "lucide-react"

interface SeoFieldProps {
  label: string
  value?: string
  onChange?: (value: string) => void
  name?: string
  maxLength?: number
  recommendedLength?: { min: number; max: number }
  placeholder?: string
  rows?: number
  isTextarea?: boolean
}

export function SeoField({
  label,
  value = "",
  onChange,
  name,
  maxLength,
  recommendedLength,
  placeholder,
  rows = 2,
  isTextarea = false,
}: SeoFieldProps) {
  const [internalValue, setInternalValue] = useState(value)
  const displayValue = onChange ? value : internalValue
  const length = displayValue.length

  const isWithinRange = recommendedLength
    ? length >= recommendedLength.min && length <= recommendedLength.max
    : true

  const handleChange = (newValue: string) => {
    setInternalValue(newValue)
    onChange?.(newValue)
  }

  const statusIcon = length === 0 ? null : isWithinRange ? (
    <CheckCircle2 className="h-4 w-4 text-green-600" />
  ) : (
    <AlertCircle className="h-4 w-4 text-amber-600" />
  )

  const statusText = recommendedLength
    ? length === 0
      ? `Recommended: ${recommendedLength.min}-${recommendedLength.max} chars`
      : isWithinRange
        ? "Good length!"
        : length < recommendedLength.min
          ? `Too short (${length}/${recommendedLength.min}-${recommendedLength.max})`
          : `Too long (${length}/${recommendedLength.min}-${recommendedLength.max})`
    : `${length}${maxLength ? `/${maxLength}` : ""} chars`

  const inputClass =
    "border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-primary w-full"

  const Component = isTextarea ? "textarea" : "input"

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="label-mono text-muted-foreground">{label}</label>
        <div className="flex items-center gap-2">
          {statusIcon}
          <span className="label-mono text-xs text-muted-foreground">{statusText}</span>
        </div>
      </div>
      <Component
        name={name}
        value={displayValue}
        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
          handleChange(e.target.value)
        }
        maxLength={maxLength}
        placeholder={placeholder}
        rows={isTextarea ? rows : undefined}
        className={`${inputClass} ${isTextarea ? "resize-y leading-relaxed" : ""}`}
      />
    </div>
  )
}
