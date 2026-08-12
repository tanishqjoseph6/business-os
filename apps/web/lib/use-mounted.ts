"use client";

import * as React from "react";

/** True only after the component has mounted in the browser. */
export function useMounted(): boolean {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}
