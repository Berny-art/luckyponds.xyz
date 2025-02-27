import { ConnectButton } from '@rainbow-me/rainbowkit';
import Logo from './ui/logo';

export default function Header() {
    return (
        <div className="flex items-center md:flex-row w-full px-6 py-4 gap-8">
            <div className='w-1/2 md:1/4 xl:w-1/5'><Logo /></div>
            <div className='flex w-1/2 justify-end md:3/4 xl:w-4/5'>
                <ConnectButton 
                    showBalance={false} 
                    chainStatus="name"
                    accountStatus="address"
                />
            </div>
        </div>
    )
}