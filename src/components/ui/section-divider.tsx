import Image from "next/image";

export function SectionDivider() {
  return (
    <div className="relative my-8 flex h-8 items-center justify-center overflow-hidden opacity-60">
      <Image
        src="/divider-seperator.jpg"
        alt=""
        fill
        className="object-cover"
      />
    </div>
  );
}
