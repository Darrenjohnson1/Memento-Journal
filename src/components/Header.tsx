import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

function Header() {
  return (
    <header className='relative flex h-24 w-full items-center justify-between bg-popover px-3 sm:px-8'>
        <Link href="/" className='flex items-end gap-2'>
            <Image src="/starburst.png" height={60} width={60} alt="logo" className='rounded-full' priority/>
            <h1>Memento Journal</h1>
        </Link>
        
    </header>
  )
}

export default Header