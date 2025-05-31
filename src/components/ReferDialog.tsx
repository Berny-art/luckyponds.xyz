import ReferralPageContent from "./ReferralPageContent";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "./ui/dialog";
import { cn } from "@/lib/utils";
import { useResponsiveBreakpoints } from "@/hooks/useBreakpoints";
import { Users } from "lucide-react";

interface ReferDialogProps {
  initialReferrerCode?: string | null;
}

export default function ReferDialog({ initialReferrerCode }: ReferDialogProps) {
  const { isLg } = useResponsiveBreakpoints();
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        <div
          className={cn(
            'flex cursor-pointer items-center justify-end gap-2 rounded-md border-2 border-drip-300',
            'bg-primary-200/10 text-primary-200 hover:bg-primary-200/20',
            'p-3 text-xs lg:pl-12 uppercase',
          )}
          aria-label="Refer a friend"
        >
          {isLg ? 'Refer a Friend' : ''}
          <Users size={18} />
        </div>
      </DialogTrigger>
      <DialogContent className="bg-secondary-950 text-primary-200">
        <DialogTitle>Refer a friend</DialogTitle>
        <ReferralPageContent initialReferrerCode={initialReferrerCode} isDialog />
      </DialogContent>
    </Dialog>
  )
}