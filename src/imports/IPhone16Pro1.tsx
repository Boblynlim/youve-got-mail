import imgIPhone16Pro1 from "figma:asset/5f5f32831b3953cae1975023de869ad257008f45.png";
import imgImage22 from "figma:asset/917e885fea50ab25627b4f2ff0ede7a32979ec7b.png";
import imgImage21 from "figma:asset/db7bf54ff89112e7140970020878f8e6226b49a7.png";

export default function IPhone16Pro() {
  return (
    <div className="relative size-full" data-name="iPhone 16 Pro - 1">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <img alt="" className="absolute h-full left-[-6.52%] max-w-none top-0 w-[124.24%]" src={imgIPhone16Pro1} />
      </div>
      <div className="absolute h-[874px] left-[-148.6px] top-0 w-[699.2px]" data-name="image 22">
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
          <img alt="" className="absolute max-w-none object-50%-50% object-cover size-full" src={imgImage22} />
          <div className="absolute bg-[rgba(0,0,0,0.4)] inset-0" />
        </div>
      </div>
      <div className="absolute h-[285px] left-[17px] top-[896px] w-[367.9px]" data-name="image 21">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img alt="" className="absolute h-[352.5%] left-[-26.8%] max-w-none top-[-118.76%] w-[153.6%]" src={imgImage21} />
        </div>
      </div>
    </div>
  );
}