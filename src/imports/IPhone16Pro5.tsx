import imgIPhone16Pro5 from "figma:asset/5f5f32831b3953cae1975023de869ad257008f45.png";
import imgImage22 from "figma:asset/917e885fea50ab25627b4f2ff0ede7a32979ec7b.png";
import imgImage21 from "figma:asset/db7bf54ff89112e7140970020878f8e6226b49a7.png";

export default function IPhone16Pro() {
  return (
    <div className="relative size-full" data-name="iPhone 16 Pro - 5">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <img alt="" className="absolute h-full left-[-6.52%] max-w-none top-0 w-[124.24%]" src={imgIPhone16Pro5} />
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
      <div className="absolute flex flex-col font-['Times_Newer_Roman:Regular',sans-serif] justify-center leading-[24px] left-[51px] not-italic text-[20px] text-white top-[200px] tracking-[-1px] translate-y-[-50%] w-[304px]">
        <p className="mb-0">{`hi you! `}</p>
        <p className="mb-0">&nbsp;</p>
        <p className="mb-0">{`there’s so many people in my life to give thanks to, and you're one of them! `}</p>
        <p className="mb-0">&nbsp;</p>
        <p className="mb-0">{`we probably don't tell people enough how much they mean to us. so i'm taking this chance to say it now. `}</p>
        <p className="mb-0">&nbsp;</p>
        <p>{`here's a letter just for you:`}</p>
      </div>
    </div>
  );
}