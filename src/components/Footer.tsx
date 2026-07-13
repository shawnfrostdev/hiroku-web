import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full bg-[#000000] border-t border-[#1F1F1F] mt-auto py-[48px] px-[24px] md:px-[48px] text-[#A3A3A3]">
      <div className="w-full flex flex-col md:flex-row justify-between items-start gap-[32px] md:gap-[64px]">
        {/* Left Section: Logo & Disclaimer */}
        <div className="flex flex-col gap-[16px] max-w-xl">
          <Link
            href="/"
            className="text-2xl font-logo text-[#FFFFFF] hover:opacity-80 transition-opacity lowercase w-fit"
          >
            hiroku
          </Link>
          <p className="text-xs leading-relaxed text-[#737373]">
            This website does not retain any files on its server. Rather, it
            solely provides links to media content hosted by third-party
            services.
          </p>
        </div>

        {/* Right Section: Navigation Links */}
        <div className="flex gap-[48px] md:gap-[96px] shrink-0">
          <div className="flex flex-col gap-[12px]">
            <Link
              href="/browse"
              className="text-sm font-semibold hover:text-[#FFFFFF] transition-colors"
            >
              Browse
            </Link>
            <Link
              href="/status"
              className="text-sm font-semibold hover:text-[#FFFFFF] transition-colors"
            >
              Status
            </Link>
          </div>
          <div className="flex flex-col gap-[12px]">
            <Link
              href="/donate"
              className="text-sm font-semibold hover:text-[#FFFFFF] transition-colors"
            >
              Donate
            </Link>
            <Link
              href="/discord"
              className="text-sm font-semibold hover:text-[#FFFFFF] transition-colors"
            >
              Discord
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom copyright row */}
      <div className="w-full border-t border-[#1F1F1F] mt-[32px] pt-[24px] flex flex-col md:flex-row justify-between items-center gap-[16px] text-xs text-[#525252]">
        <div>
          &copy; {new Date().getFullYear()}{" "}
          <Link href="/" className="hover:underline text-[#737373]">
            hiroku.com
          </Link>{" "}
          | Website by <span className="text-[#A3A3A3]">Hiroku Team</span>
        </div>
        <div className="flex items-center gap-[16px]">
          <span className="bg-[#1F1F1F] px-[8px] py-[3px] rounded-[6px] text-[10px] font-bold text-[#A3A3A3]">
            v1.0.0
          </span>
        </div>
      </div>
    </footer>
  );
}
