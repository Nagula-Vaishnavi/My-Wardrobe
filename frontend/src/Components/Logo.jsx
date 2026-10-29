import { Shirt } from "lucide-react";

function Logo() {
  return (
    <div className="logo">
      <span className="logo-mark">
        <Shirt size={17} strokeWidth={1.8} />
      </span>

      <span>mywardrobe</span>
    </div>
  );
}

export default Logo;