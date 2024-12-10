import React, { ReactNode } from "react";

interface ContentProps {
  children: ReactNode;
}

const Content: React.FC<ContentProps> = ({ children }) => {
  return (
    <div className="relative overflow-hidden bg-orange-50/50 py-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">{children}</div>
      </div>
    </div>
  );
};

export default Content;
