import lookBook1 from '../../Imgs/zeroz/lookBook1.jpg'
import lookBook2 from '../../Imgs/zeroz/lookBook2.jpg'
import lookBook3 from '../../Imgs/zeroz/lookBook3.jpg'
import lookBook4 from '../../Imgs/zeroz/lookBook4.jpg' 
import LookBookStyle from './LookBookStyle.css'

export default function LookBook() {
    return (
        <>
            <h1 className="lookBookTitle text-7xl font-semibold text-center my-[6%]">Lookbook</h1>
            <div className="lookBookContainer mx-[1.5%] my-[5%]">
                <img src={lookBook1}/>
                <div className="lookBookTxtDiv flex justify-evenly my-[3%]">
                    <h3 className="text-5xl font-semibold">Fall/Winter 2024</h3>
                    <div className="w-[25%] text-[1.1rem] flex flex-col items-start">
                        <p className="text-gray-400">Elementum donec leo vulputate sit proin suspendisse malesuada neque proin
                        gravida ut platea vitae duis hac hac vel id ipsum ultricies ut faucibus ultrices.</p>
                        <button className="duration-[0.8s] my-[5%] border-b-2 border-[#f6aa28] hover:border-[#262b2c] font-semibold">SHOP NOW</button>
                    </div>
                </div>
            </div>

            <div className="lookBookContainer mx-[1.5%] my-[5%]">
                <img src={lookBook2}/>
                <div className="lookBookTxtDiv flex justify-evenly my-[3%]">
                    <h3 className="text-5xl font-semibold">Spring/Summer 2024</h3>
                    <div className="w-[25%] text-[1.1rem] flex flex-col items-start">
                        <p className="text-gray-400">Elementum donec leo vulputate sit proin suspendisse malesuada neque proin
                        gravida ut platea vitae duis hac hac vel id ipsum ultricies ut faucibus ultrices.</p>
                        <button className="duration-[0.8s] my-[5%] border-b-2 border-[#f6aa28] hover:border-[#262b2c] font-semibold">SHOP NOW</button>
                    </div>
                </div>
            </div>

            <div className="lookBookContainer mx-[1.5%] my-[5%]">
                <img src={lookBook3}/>
                <div className="lookBookTxtDiv flex justify-evenly my-[3%]">
                    <h3 className="text-5xl font-semibold">Go & Play</h3>
                    <div className="w-[25%] text-[1.1rem] flex flex-col items-start">
                        <p className="text-gray-400">Elementum donec leo vulputate sit proin suspendisse malesuada neque proin
                        gravida ut platea vitae duis hac hac vel id ipsum ultricies ut faucibus ultrices.</p>
                        <button className="duration-[0.8s] my-[5%] border-b-2 border-[#f6aa28] hover:border-[#262b2c] font-semibold">SHOP NOW</button>
                    </div>
                </div>
            </div>

            <div className="lookBookContainer mx-[1.5%] my-[5%]">
                <img src={lookBook4}/>
                <div className="lookBookTxtDiv flex justify-evenly my-[3%]">
                    <h3 className="text-5xl font-semibold">Adventurer Gear</h3>
                    <div className="w-[25%] text-[1.1rem] flex flex-col items-start">
                        <p className="text-gray-400">Elementum donec leo vulputate sit proin suspendisse malesuada neque proin
                        gravida ut platea vitae duis hac hac vel id ipsum ultricies ut faucibus ultrices.</p>
                        <button className="duration-[0.8s] my-[5%] border-b-2 border-[#f6aa28] hover:border-[#262b2c] font-semibold">SHOP NOW</button>
                    </div>
                </div>
            </div>
        </>
    )
}