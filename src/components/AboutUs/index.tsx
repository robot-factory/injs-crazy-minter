import React from "react";
import Image from "next/image";
import Link from "next/link";

const AboutUs: React.FC = () => {
  return (
    <div className="flex flex-col">
      <h1 className="text-4xl font-bold">欢迎加入科学家的队伍</h1>
      <p className="text-xs mt-2 text-gray-400">进群免费领工具</p>
      <Image src="/shareQrcode.jpeg" width={360} alt="" height={400} />
      <div className="flex justify-center mb-2 space-x-2">
        <Link
          href={`https://twitter.com/InscriptionBot`}
          target="_blank"
          className="flex items-center justify-center"
        >
          <Image
            src="/icons/twitter.svg"
            width={24}
            height={24}
            alt="twitter"
          />
        </Link>
        <Link
          href={`https://t.me/+hYSsEN9xutMwZTRl`}
          className="w-6 h-6"
          target="_blank"
        >
          <Image
            src="/icons/telegram.svg"
            width={24}
            height={24}
            alt="twitter"
          />
        </Link>
      </div>
      <Link
        href={`https://github.com/BohengLiu/injs-crazy-minter`}
        target="_blank"
        className="flex items-center justify-center mt-2"
      >
        <Image src="/icons/github.svg" width={24} height={24} alt="twitter" />
        <span className="underline ml-2">开源安全可直接下载代码</span>
      </Link>
    </div>
  );
};

export default AboutUs;
