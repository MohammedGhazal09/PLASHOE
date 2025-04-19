import ourStoryShoes from '../../Imgs/zeroz/ourStoryShoes.jpg'
import shoes from '../../Imgs/zeroz/shoes.png'
import RecycledImg from '../../Imgs/zeroz/RecycledImg.png'
import VeganImg from '../../Imgs/zeroz/VeganImg.png'
import handMadeImg from '../../Imgs/zeroz/handMadeImg.png'
import OurStoryStyle from './OurStoryStyle.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCat, faHandsHolding, faLeaf } from '@fortawesome/free-solid-svg-icons'
export default function OurStory(){
    return(
        <>
            <h1 className="ourStoryTitle text-7xl text-center font-semibold">Our Story</h1>
            <h4 className="ourStorySideHeader text-4xl text-center font-semibold mx-[12%] my-[2.5%]">Taking a stylish and sustainable footwear with a focus on creating
                a positive impact on both the world and the people</h4>
            <div className='ourStoryImg flex justify-center mx-[3%]'>
                <img className='mt-[2.5%]' src={ourStoryShoes}/>
            </div>
            <div className="ourStorySpecs flex items-center my-[2.5%] mx-[13%]">
                <div className='flex justify-between w-[100%] min-w-[fit-content] gap-x-[5%] mt-[2%] '>
                    <div className=''>
                        <FontAwesomeIcon className='text-[#6e7051] text-2xl mb-[1.5%]' icon={faHandsHolding} />
                        <h5 className='text-xl font-semibold mb-[1%]'>Ethics and equality</h5>
                        <p className='text-[#979A9B]'>Pellentesque quam convallis massa enim, faucibus ornare sollicitudin
                            gravida justo sit suspendisse pellentesque.</p>
                    </div>
                    <div className=''>
                        <FontAwesomeIcon className='text-[#6e7051] text-2xl mb-[1.5%]' icon={faLeaf} />
                        <h5 className='text-xl font-semibold mb-[1%]'>Eco-design</h5>
                        <p className='text-[#979A9B]'>Risus leo molestie a aliquam amet urna orci nisl
                            dignissim elementum nibh felis ultrices vitae consectetur.</p>
                    </div>
                    <div className=''>
                        <FontAwesomeIcon className='text-[#6e7051] text-2xl mb-[1.5%]' icon={faCat} />
                        <h5 className='text-xl font-semibold mb-[1%]'>Wildlife Preservation</h5>
                        <p className='text-[#979A9B]'>Pellentesque nunc ante augue adipiscing sed suspendisse amet sed
                            pellentesque convallis erat nibh vivamus.</p>
                    </div>
                </div>
            </div>
            <div className='missionVisionContainer flex flex-col justify-center items-center bg-[#eee] my-[3%] mx-[3%]'>
                <div className='flex mx-[15%] mt-[5%] gap-x-[40%]'>
                    <h5 className='text-2xl font-semibold'>Mission</h5>
                    <div className='text-[#979A9B] text-lg'>
                        <p className='mb-[5%]'>
                            Pulvinar sed nunc ultrices consequat adipiscing sagittis feugiat at dui,
                            arcu nec id non pellentesque dolor feugiat dolor ac ac sem semper nulla dis vitae,
                            quis elit odio nunc dignissim aliquam ipsum.
                        </p>
                        <p>
                            Mattis pretium nec tellus viverra phasellus sed tortor ac tincidunt adipiscing nibh eget,
                            adipiscing sit penatibus lobortis placerat     
                        </p>    
                    </div>
                </div>
                <div className='flex mx-[15%] my-[5%] gap-x-[40%]'>
                    <h5 className='text-2xl font-semibold'>Vision</h5>
                    <div className='text-[#979A9B] text-lg'>
                        <p className=''>
                            Sit etiam est, nunc sollicitudin malesuada tincidunt senectus venenatis,
                            adipiscing nulla vel diam, lorem donec sit blandit nec tortor,
                            diam cras ut velit nulla purus ullamcorper ornare elit bibendum augue.
                        </p> 
                    </div>
                </div>
            </div>
            <div className='mx-[3%] pt-20 mb-[3%]'>
                <h2 className='text-5xl font-semibold text-center py-10'>See how your shoes are made</h2>
                <p className='text-gray-400 text-center text-[1.2rem] mx-auto pb-5 w-5/12'>Urna, felis enim orci accumsan urna blandit
                egestas mattis egestas feugiat viverra ornare donec adipiscing semper aliquet integer
                risus leo volutpat nulla enim ultrices.</p>
                <div className='makingContainer grid grid-flow-col grid-cols-3'>
                    <div className='beforeImg pt-10 w-5/12 mx-auto text-start'>
                        <h6 className='text-orange-400 font-semibold mb-3'>01.</h6>
                        <h4 className='text-2xl font-semibold mb-3'>Pet canvas</h4>
                        <p className='text-gray-400'>Morbi eget bibendum sit adipiscing morbi ac nisl vitae maecenas nulla cursus</p>
                    </div>
                    <div className='beforeImg pt-10 w-5/12 mx-auto text-start'>
                        <h6 className='text-orange-400 font-semibold mb-3'>02.</h6>
                        <h4 className='text-2xl font-semibold mb-3'>Algae foam + vegan glue</h4>
                        <p className='text-gray-400'>Enim tincidunt donec vulputate magna pharetra mattis in</p>
                    </div>
                    <div className='shoes pt-10 row-span-2 my-auto col-start-2 row-start-1'>
                        <img className='' src={shoes}/>
                    </div>
                    <div className='afterImg pt-10 w-5/12 mx-auto text-end'>
                        <h6 className='text-orange-400 font-semibold mb-3'>03.</h6>
                        <h4 className='text-2xl font-semibold mb-3'>Organic cotton</h4>
                        <p className='text-gray-400'>A vel ipsum, sed dignissim elementum ultrices amet</p>
                    </div>
                    <div className='afterImg pt-10 w-5/12 mx-auto text-end'>
                        <h6 className='text-orange-400 font-semibold mb-3'>04.</h6>
                        <h4 className='text-2xl font-semibold mb-3'>Upcycled plastic bottles</h4>
                        <p className='text-gray-400'>Pellentesque viverra amet netus facilisis amet felis odio tortor orci cursus est</p>
                    </div>
                </div>
            </div>
            <div className='veganRecycledHandmadeContainer flex justify-between gap-x-[2%] min-w[fit-content] mx-[10%] px-[8%] border-t py-[3%] my-[5%] border-[#e4e6e7'>
                <p className='w-[50%] text-[1.2rem] text-[#979A9B]'>
                    Eu eget felis erat mauris aliquam mattis lacus, arcu leo aliquam sapien pulvinar laoreet vulputate sem
                    aliquet phasellus egestas felis, est, vulputate morbi massa mauris vestibulum dui odio.
                </p>
                <div className='flex gap-x-[10%] w-[40%]'>
                    <img className='w-[100px] h-[100px]' src={VeganImg}/>
                    <img className='w-[100px] h-[100px]' src={RecycledImg}/>
                    <img className='w-[100px] h-[100px]' src={handMadeImg}/>
                </div>
            </div>
        </>
    )
}