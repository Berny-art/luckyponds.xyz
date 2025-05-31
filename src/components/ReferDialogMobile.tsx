import ReferralPageContent from "./ReferralPageContent";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "./ui/dialog";
import { SheetClose } from "./ui/sheet";

interface ReferDialogMobileProps {
  initialReferrerCode?: string | null;
}

export default function ReferDialogMobile({ initialReferrerCode }: ReferDialogMobileProps) {
  return (
    <Dialog>
      <SheetClose asChild>
        <DialogTrigger asChild>
          <div
            className="flex items-center bg-secondary-900/30 p-4 transition-colors hover:text-drip-300 cursor-pointer"
          >
            Refer Friend
          </div>
        </DialogTrigger>
      </SheetClose>
      <DialogContent className="bg-secondary-950 text-primary-200 max-w-[95vw] border-2 border-primary-200 rounded-lg">
        <DialogTitle>Refer a friend</DialogTitle>
        <ReferralPageContent initialReferrerCode={initialReferrerCode} isDialog />
      </DialogContent>
    </Dialog>
  )
}
