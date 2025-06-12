import Image from "next/image";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import Link from "next/link";
import { BONUS_PRIZE } from "@/lib/constants";
import { Gift } from "lucide-react";

export default function BonusPrize({ isIconOnly = false }: { isIconOnly?: boolean }) {

  return (

    <Dialog>
      <DialogTrigger className="cursor-pointer">
        {isIconOnly ? (
          <div
            className="p-3 border-2 border-drip-300 rounded-md animate-gradient bg-[linear-gradient(90deg,#F2E718_0%,#80E8A9_20%,#9353ED_50%,#ED5353_75%,#EDA553_100%)] text-white shadow-[0px_0px_12px_4px_rgba(175,_242,_226,_0.5)]">
            <Gift size={18} />
          </div>
        ) : (
          <div className="hidden group fixed bottom-0 left-[50%] -translate-x-[50%] lg:translate-x-0 lg:left-32 z-10 md:flex flex-col items-center justify-center translate-y-32 lg:translate-y-32 hover:-translate-y-12 transition-transform duration-300 ease-in-out">
            <p className="text-drip-300 z-10 font-mono font-bold text-lg uppercase">Bonus prize</p>
            <div className="animate-gradient bg-[linear-gradient(90deg,#F2E718_0%,#80E8A9_20%,#9353ED_50%,#ED5353_75%,#EDA553_100%)] rounded-lg p-1 shadow-[0px_-28px_56px_8px_rgba(175,_242,_226,_0.5)]">
              {BONUS_PRIZE.imageUrl && BONUS_PRIZE.imageUrl !== undefined ? (
                <>
                  <Image
                    src={BONUS_PRIZE.imageUrl}
                    alt={BONUS_PRIZE.title}
                    width={200}
                    height={200}
                    className="rounded animate-pulse group-hover:animate-none"
                  />
                  <span className="text-white font-mono uppercase">Click me</span>
                </>
              ) : (
                <p className="flex text-white size-48 aspect-square justify-center items-center text-5xl">?</p>
              )}
            </div>
          </div>

        )}
      </DialogTrigger>
      <DialogContent className="bg-secondary-950 text-primary-200 border-2 border-primary-200 rounded-lg font-mono max-w-[95vw] md:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Weekly Pond Bonus Prize
          </DialogTitle>
          <DialogDescription className="text-primary-200/70">
            Participate in any weekly pond and get a chance to win a bonus prize!
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col justify-center items-center md:flex-row gap-8">
          <Image
            src={BONUS_PRIZE.imageUrl}
            alt={BONUS_PRIZE.title}
            width={200}
            height={200}
            className="rounded border-drip-300 border-2"
          />
          <div className="flex w-full flex-col items-center md:items-start gap-4">
            <div className="text-center md:text-left">
              <h3 className="text-2xl text-drip-300 font-bold uppercase mb-6">This weeks prize!</h3>
              <p>{BONUS_PRIZE.title}</p>
              <p className="text-primary-200/70 text-sm ">Sponsored by {BONUS_PRIZE.sponsoredBy ?? 'Lucky Ponds'}</p>
            </div>
            <div>
              <h3 className="text-lg font-bold">How to Participate</h3>
              <ol className="list-decimal ml-2 pl-5 text-sm font-medium mb-3">
                <li>Toss a coin in any pond.</li>
                <li>More tosses, more chances.</li>

              </ol>
              <p className="text-xs">Follow <Link href={BONUS_PRIZE.luckyPondsXUrl} target="_blank" className="text-drip-300 underline">@LuckyPonds</Link> on X for winner announcement. Randomly picked on June 16, 06:00 UTC.</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}