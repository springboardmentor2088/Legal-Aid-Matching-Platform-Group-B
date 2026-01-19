import React from "react";
const ChatLayout = ({
  children,
  className = "",
  fullHeight = true,
}) => {
  return (
    <div
      className={`
        relative
        bg-white dark:bg-gray-900
        rounded-xl
        shadow-lg
        overflow-hidden
        flex
        flex-col
        ${fullHeight ? "h-full" : ""}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default ChatLayout;
