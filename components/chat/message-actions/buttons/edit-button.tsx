"use client"

import React from "react"
import { FiEdit2 } from "react-icons/fi"
import { MessageActionButton } from "@components/ui/message-action-button"
import { useEditAction } from "../hooks/use-edit-action"

interface EditButtonProps {
  onEdit: () => void
  tooltipPosition?: "top" | "bottom" | "left" | "right"
  className?: string
}

/**
 * 编辑按钮组件
 * 
 * 封装了编辑功能的按钮，点击后会触发编辑回调
 */
export const EditButton: React.FC<EditButtonProps> = ({
  onEdit,
  tooltipPosition = "bottom",
  className
}) => {
  const { handleEdit } = useEditAction(onEdit)
  
  return (
    <MessageActionButton
      icon={FiEdit2}
      label="编辑"
      onClick={handleEdit}
      tooltipPosition={tooltipPosition}
      className={className}
    />
  )
}
