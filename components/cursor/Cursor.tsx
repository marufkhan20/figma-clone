import CursorSVG from "@/public/assets/CursorSVG";

interface IProps {
  color: string;
  x: number;
  y: number;
  message: string;
}

const Cursor = ({ color, x, y, message }: IProps) => {
  return (
    <div
      className="pointer-events-none absolute top-0 left-0"
      style={{ transform: `translateX(${x}px) translateY(${y}px)` }}
    >
      <CursorSVG color={color} />

      {/* TODO: message */}
    </div>
  );
};

export default Cursor;
