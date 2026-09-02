import { useEffect, useState } from "react";
import { animate } from "framer-motion";

export function CountUp({
  value,
  duration = 0.9,
  decimals = 0,
}: {
  value: number;
  duration?: number;
  decimals?: number;
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(0, value, {
      duration,
      ease: "easeOut",
      onUpdate: (latest) => setDisplay(latest),
    });
    return () => controls.stop();
  }, [value, duration]);

  return <>{display.toFixed(decimals)}</>;
}
