import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'
import {faArrowsRotate, faLock, faTruck} from '@fortawesome/free-solid-svg-icons'
import {faCopyright} from '@fortawesome/free-regular-svg-icons'
import {faInstagram, faPinterestP, faFacebook, faXTwitter} from '@fortawesome/free-brands-svg-icons'
import FooterStyle from './FooterStyle.css'
import PaymentMethods from '../../Imgs/zeroz/PaymentMethods.png'

export default function Footer(){
    return(
        <>
            <div className='betterForDiv flex flex-col justify-center items-center'>
                <h1 className='text-white'>Better for People & the Planet</h1>
                <p className='text-white text-md'>Ut eget at et aliquam sit quis nisl, pharetra et ac pharetra est dictum in vulputate</p>
                <div className='flex justify-center gap-x-5'>
                <a href="/men"><button className='bg-white text-black px-10 py-3 font-semibold'>SHOP MEN</button></a>
                <a href="/women"> <button className='bg-white text-black px-10 py-3 font-semibold'>SHOP WOMEN</button></a>
                </div>
            </div>

            <div className='pros flex justify-center border-b'>
                <div className='border-e flex'>
                    <FontAwesomeIcon className='icons' icon={faLock}/>
                    <p>Secure Payment</p>
                </div>
                <div className='border-e flex'>
                    <FontAwesomeIcon className='icons' icon={faTruck}/>
                    <p>Express Shipping</p>
                </div>
                <div className='flex'>
                    <FontAwesomeIcon className='icons' icon={faArrowsRotate}/>
                    <p>Free Return</p>
                </div>
            </div>

            <div className='footerContainer flex justify-center'>
                <div className='footerRouteContainer'>
                    <h2 className='text-2xl tracking-wider font-semibold'>PLASHOE</h2>
                    <p className='text-gray-500'>Praesent eget tortor sit risus egestas nulla pharetra
                    ornare quis bibendum est bibendum sapien proin nascetur</p>
                    <div className='iconsContainer flex gap-x-5 mt-12 text-lg'>
                        <a href='#'><FontAwesomeIcon icon={faInstagram} /></a>
                        <a href='#'><FontAwesomeIcon icon={faPinterestP} /></a>
                        <a href='#'><FontAwesomeIcon icon={faFacebook} /></a>
                        <a href='#'><FontAwesomeIcon icon={faXTwitter} /></a>
                    </div>     
                </div>
                <div className='footerRouteContainer'>
                <h2 className='text-2xl tracking-wider font-semibold'>Shop</h2>
                <ul>
                    <li className=''>
                        <a href='/men'>Shop Men</a>
                    </li>
                    <li className=''>
                        <a href='/women'>Shop Women</a>
                    </li>
                    <li className=''>
                        <a href='/lookbook'>Lookbook</a></li>
                    <li className=''>
                        <a href='#'>Gift Card</a>
                    </li>
                    <li className=''>
                        <a href='/sale'>Sale</a>
                    </li>
                </ul>
                </div>
                <div className='footerRouteContainer'>
                <h2 className='text-2xl tracking-wider font-semibold'>About</h2>
                <ul>
                    <li className=''>
                        <a href='/ourstory'>Our Story</a>
                    </li>
                    <li className=''>
                        <a href='#'>Our Materials</a>
                    </li>
                    <li className=''>
                        <a href='#'>Our Value</a>
                    </li>
                    <li className=''>
                        <a href='#'>Sustainability</a>
                    </li>
                    <li className=''>
                        <a href='#'>Manufacture</a>
                    </li>
                </ul>
                </div>
                <div className='footerRouteContainer'>
                <h2 className='text-2xl tracking-wider font-semibold'>Need Help?</h2>
                <ul>
                    <li className=''>
                        <a href='/contact'>FAQs</a>
                    </li>
                    <li className=''>
                        <a href='#'>Shipping & Returns</a>
                    </li>
                    <li className=''>
                        <a href='#'>Shoe Care</a></li>
                    <li className=''>
                        <a href='#'>Size Chart</a>
                    </li>
                    <li className=''>
                        <a href='/contact'>Contact Us</a>
                    </li>
                </ul>
                </div>
            </div>

            <div className='copyRightContainer flex justify-around py-14 '>
                <div className='text-sm text-gray-400'>
                    <p className='text-center'><FontAwesomeIcon icon={faCopyright} className='text-xs' /> 2024 Recycled Shoe Store. Powered by Recycled Shoe Store.</p>
                </div>
                <img src={PaymentMethods} />
            </div>
        </>
    )
}