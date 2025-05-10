"use client"

import React from "react"
import { FiThumbsUp, FiThumbsDown, FiCheck } from "react-icons/fi"
import { MessageActionButton } from "@components/ui/message-action-button"
import { useFeedbackAction } from "../hooks/use-feedback-action"

interface FeedbackButtonProps {
  onFeedback: (isPositive: boolean) => void
  isPositive: boolean
  tooltipPosition?: "top" | "bottom" | "left" | "right"
  className?: string
}

/**
 * 反馈按钮组件
 * 
 * 封装了反馈功能的按钮，点击后会触发反馈回调
 * 可以是点赞或踩按钮，取决于isPositive属性
 */
export const FeedbackButton: React.FC<FeedbackButtonProps> = ({
  onFeedback,
  isPositive,
  tooltipPosition = "bottom",
  className
}) => {
  const { handleFeedback, hasFeedback } = useFeedbackAction(onFeedback)
  
  return (
    <MessageActionButton
      icon={isPositive ? FiThumbsUp : FiThumbsDown}
      activeIcon={FiCheck}
      label={isPositive ? "有用" : "无用"}
      activeLabel="已评价"
      onClick={() => handleFeedback(isPositive)}
      active={hasFeedback}
      tooltipPosition={tooltipPosition}
      className={className}
    />
  )
}
