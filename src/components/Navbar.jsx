import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {assets} from '../assets/assets'

const Navbar = () => {
    const [showMobileMenu, setShowMobileMenu] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        if(showMobileMenu) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'auto'
        }
        return () => {
            document.body.style.overflow = 'auto'
        };
    }, [showMobileMenu])

    const handleSignUpClick = () => {
        navigate('/login')
    }

    return (
        <div className='absolute top-0 left-0 w-full z-10'>
            <div className='container mx-auto flex justify-between
            items-center py-4 px-6 md:px-20 lg:px-32
            bg-transparent'>
                <img src={assets.logo} alt="" />
                <ul className='hidden md:flex gap-7 text-white'>
                    <a href="#Header" className='cursor-pointer
                    hover:text-gray-400'>Home</a>
                    <a href="#PerformanceTracker" className='cursor-pointer
                    hover:text-gray-400'>Performance Tracker</a>
                    <a href="#HealthMonitoring" className='cursor-pointer
                    hover:text-gray-400'>Health Monitoring</a>
                    <a href="#Coaches" className='cursor-pointer
                    hover:text-gray-400'>Coaches</a>
                </ul>
                <button onClick={handleSignUpClick} className='hidden md:block bg-white px-8 py-2
                rounded-full'>Sign Up</button>
                <img onClick={() => setShowMobileMenu(true)} src={assets.menu_icon} className='md:hidden
                w-7 cursor-pointer' alt="" />
            </div>
            {/*-----mobile-menu----*/}
            <div className={`md:hidden ${showMobileMenu ? 'fixed w-full' : 'h-0 w-0'}  right-0 top-0 bottom-0
            overflow-hidden bg-white transition-all`}>
                <div className='flex justify-end p-6 cursor-pointer '>
                    <img onClick={() => setShowMobileMenu(false)} src={assets.cross_icon} className='w-6' alt="" />
                </div>
                <ul className='flex flex-col items-center gap-2 mt-5 px-5 text-lg font-medium'>
                    <a onClick={() => setShowMobileMenu(false)} href="#Header" className='px-4 py-2 rounded-full
                    inline-block'>Home</a>
                    <a onClick={() => setShowMobileMenu(false)} href="#PerformanceTracker" className='px-4 py-2
                    rounded-full inline-block'>Performance Tracker</a>
                    <a onClick={() => setShowMobileMenu(false)} href="#HealthMonitoring" className='px-4 py-2
                    rounded-full inline-block'>HealthMonitoring</a>
                    <a onClick={() => setShowMobileMenu(false)} href="#Coaches" className='px-4 py-2 rounded-full inline-block'>Coaches</a>
                    <button onClick={() => {
                        setShowMobileMenu(false)
                        navigate('/login')
                    }} className='px-4 py-2 rounded-full inline-block bg-blue-600 text-white'>Sign Up</button>
                </ul>
            </div>
        </div>
    )
}

export default Navbar