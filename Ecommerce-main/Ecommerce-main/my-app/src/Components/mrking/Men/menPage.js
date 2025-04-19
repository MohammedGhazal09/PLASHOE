import { useState, useEffect } from "react";
import "./menPage.css";
import * as React from "react";
import Slider from "@mui/material/Slider";
import { Dehaze } from "@mui/icons-material";
import Button from "@mui/material/Button";
import Rating from "@mui/material/Rating";
import MUIButton from "../NumberInputWithButtons";
import Checkbox from "@mui/material/Checkbox";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Sorter from "../SortBox";
import CloseIcon from "@mui/icons-material/Close";
import { faX } from '@fortawesome/free-solid-svg-icons'
import { faEnvelope } from '@fortawesome/free-regular-svg-icons'
import { faPinterestP, faXTwitter , faFacebook, faInstagram } from '@fortawesome/free-brands-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

// #0e1017 #16ffbd
export default function MenPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [male, setMale] = useState([]);
  const [filteredShoes, setFilteredShoes] = useState([]);
  const [minPrice, setMinPrice] = useState(50);
  const [maxPrice, setMaxPrice] = useState(110);
  const [ratingFilter, setRatingFilter] = useState(0);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [sortOption, setSortOption] = useState("");


   async function test(){
      try{
          const response = await fetch(`${window.location.toString().slice(0,-3)}database/database.json`);
          console.log(`${window.location.toString().slice(0,-3)}`);
          
          if (!response.ok) {
              throw new Error('Network response was not ok');
          }
          const json = await response.json();
          const menData = json.male.map((item) => ({
            ...item,
            price: {
              ...item.price,
              new: parseFloat(item.price.new.replace("$", "")),
              old: parseFloat(item.price.old.replace("$", "")),
            },
          }));
          
          setMale(menData);
          
      }catch(error){
          console.error(error.message);
      }
  }
  useEffect(()=>{
      test();
  }, [])

  

  const [highQuickView, setHighQuickView] = useState(false);
  const [latestQuickView, setLatestQuickView] = useState(false);
  const [shoesSize, setShoesSize] = useState("")
  const [highQuickVal, setHighQuickVal] = useState('');
  const highQuickViewChange = (e) => {
      setHighQuickView(!highQuickView);
      setShoesNum(1);
      setShoesSize(35);
      if(document.querySelector('body').style.overflow == 'hidden'){
          document.querySelector('body').style.overflow = 'visible';
      }else{
          document.querySelector('body').style.overflow = 'hidden';
      }
      // console.log(e.target.value)
      if(e.target.textContent != ''){
          setHighQuickVal(male.filter(item => item.name == e.target.textContent )|| "");
      }else{
        console.log(`${window.location.toString().slice(0,-3)}${male[0].img.substr(1)}`);
          setHighQuickVal(male.filter(item => (`${window.location.toString().slice(0,-3)}${item.img.substr(1)}`).toString() == e.target.src) || "");
        }
        setShoesNum(1);
      }      
  function sizeChanging(){        
      let getSize = document.querySelector('.size');
      setShoesSize(getSize.value || 35);
  }

  let [shoesNum, setShoesNum] = useState(1)
  function addShoes(){
      setShoesNum(++shoesNum);
  }
  function removeShoes(){
      if(shoesNum > 1)
      setShoesNum(--shoesNum);
  }
  function addToCart(e) {
      const itemName = e.target.parentNode.parentNode.firstChild.innerHTML;
      const itemToAdd = {
          ...male.find(item => item.name === itemName),
          shoesNumber: shoesNum,
          shoesSize: shoesSize
          
      };
      if(latestQuickView){
          setLatestQuickView(!latestQuickView);
      }else if(highQuickView){
          setHighQuickView(!highQuickView);
      }
      document.querySelector('body').style.overflow = 'visible';
      // Retrieve current items from local storage
      const currentItems = JSON.parse(localStorage.getItem("item")) || [];
      // Add the new item to the list
      const updatedItems = [...currentItems, itemToAdd];
      // Save updated list back to local storage
      localStorage.setItem("item", JSON.stringify(updatedItems));

      // Trigger storage event to sync other components
      window.dispatchEvent(new Event('storage'));
      setShoesNum(1);
  }

  const handleFilterChange = (event, values) => {
    setMinPrice(values[0]);
    setMaxPrice(values[1]);
  };

  const handleMinPriceChange = (newValue) => {
    setMinPrice(newValue);
    if (newValue > maxPrice) setMaxPrice(newValue); 
  };

  const handleMaxPriceChange = (newValue) => {
    setMaxPrice(newValue);
    if (newValue < minPrice) setMinPrice(newValue);
  };

  const handleRatingChange = (event, newRating) => {
    setRatingFilter(newRating);
  };

  const handleCategoryChange = (event) => {
    const category = event.target.name;
    setSelectedCategories((prevCategories) =>
      event.target.checked
        ? [...prevCategories, category]
        : prevCategories.filter((c) => c !== category)
    );
  };

  const handleSortChange = (option) => {
    setSortOption(option);
  };

  const applyFilters = () => {
    let filtered = male.filter(
      (shoe) =>
        shoe.price.new >= minPrice &&
        shoe.price.new <= maxPrice &&
        shoe.rating >= ratingFilter &&
        (selectedCategories.length === 0 ||
          selectedCategories.includes(shoe.category))
    );

    if (sortOption === "rating") {
      filtered = filtered.sort((a, b) => b.rating - a.rating);
    } else if (sortOption === "priceLowToHigh") {
      filtered = filtered.sort((a, b) => a.price.new - b.price.new);
    } else if (sortOption === "priceHighToLow") {
      filtered = filtered.sort((a, b) => b.price.new - a.price.new);
    }
    
    setFilteredShoes(filtered);
  };

  useEffect(() => {
    applyFilters();
  }, [minPrice, maxPrice, ratingFilter, selectedCategories, sortOption, male]);

    const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth <= 700);
  
    useEffect(() => {
      const handleResize = () => {
        setIsSmallScreen(window.innerWidth <= 700);
      };
      window.addEventListener('resize', handleResize);
      
      return () => window.removeEventListener('resize', handleResize);
    }, []);

    const toggleMenu = () => {
      setIsOpen((prevIsOpen) => {
        if (isSmallScreen) {
          document.body.style.overflow = !prevIsOpen ? "hidden" : "auto";
        }
        return !prevIsOpen;
      });
    };
    
    useEffect(() => {
      return () => {
        document.body.style.overflow = "auto";
      };
    }, []);
  return (
    <div>
      <div
        className="flex"
        style={{
          backgroundColor: "#f1f1ef",
          borderColor: "#f1f1ef",
          borderWidth: "0 20px",
          margin: "50px auto",
          minWidth: "300px",
          maxWidth: "1300px",
        }}
      >
        {isOpen && (
          <div className="sidebar h-[300px] bg-[#f1f1ef] w-[270px] top-[150px] left-[100px] z-[1] shadow-2xl">
            <div className="flex justify-between flex-row items-center bg-[#6e7051] rounded-t-lg">
              <h1 className=" p-5 text-white text-2xl bg-[#6e7051] font-medium font-sans rounded-t-lg">
                Filter
              </h1>
              <CloseIcon
                sx={{ marginRight: "15px", color: "white",cursor:"pointer"}}
                onClick={toggleMenu}
              />
            </div>
            <div className="filter p-5 bg-[rgb(204,201,190)] rounded-b-lg">
              <p className="mb-3 text-white font-semibold">Price Range</p>
              <Slider
                sx={{ color: "#6e7051" }}
                min={50}
                max={110}
                value={[minPrice, maxPrice]}
                onChange={handleFilterChange}
                valueLabelDisplay="auto"
                aria-labelledby="range-slider"
              />
              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <MUIButton
                  min={50}
                  max={maxPrice}
                  value={minPrice}
                  onChange={handleMinPriceChange}
                  label="Min Price"
                />
                <MUIButton
                  min={minPrice}
                  max={110}
                  value={maxPrice}
                  onChange={handleMaxPriceChange}
                  label="Max Price"
                />
              </div>
              <p className="py-3 mt-3 text-white font-semibold">Rating</p>
              <Rating
                name="half-rating"
                defaultValue={5}
                precision={0.5}
                sx={{ color: "#6e7051" }}
                value={ratingFilter}
                onChange={handleRatingChange}
              />
              <p className="mt-3 text-white font-semibold ">Categories</p>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="Running"
                      checked={selectedCategories.includes("Running")}
                      onChange={handleCategoryChange}
                    />
                  }
                  label="Running"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      name="Classic"
                      checked={selectedCategories.includes("Classic")}
                      onChange={handleCategoryChange}
                    />
                  }
                  label="Classic"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      name="Sneaker"
                      checked={selectedCategories.includes("Sneaker")}
                      onChange={handleCategoryChange}
                    />
                  }
                  label="Sneaker"
                />
              </FormGroup>
            </div>
          </div>
        )}

        <div
          className="m-auto"
          style={{ backgroundColor: "white", width: "100%" }}
        >
          <h1
            className="p-10 text-7xl font-semibold mb-10 max-[407px]:flex justify-center"
            style={{ color: "#6e7051" }}
          >
            Men
          </h1>
          <div className="filterNSort flex justify-between flex-row items-center">
            <div className="filter" style={{ marginLeft: "3%" }}>
              <Button
                onClick={toggleMenu}
                component="label"
                role={"button"}
                tabIndex={-1}
                startIcon={<Dehaze />}
                sx={{
                  color: "white",
                  backgroundColor: "#6e7051",
                  padding: "15px 10px",
                  whiteSpace: "nowrap",
                }}
              >
                Filter Shoes
              </Button>
            </div>
            <div className="sort mr-[3%]">
              <Sorter onSortChange={handleSortChange} />
            </div>
          </div>
          <div className='ourBestSeller pb-12'>
                <div className='headerDiv flex py-10 justify-between'>
                    <h4 className='text-2xl font-semibold'>Last Pairs</h4>
                    <button className='pt-2 border-b-2 border-orange-400 hover:border-black duration-500 font-semibold tracking-wider'>VIEW ALL SALES</button>
                </div>
                <div className='mainGrid grid grid-flow-row grid-cols-3 gap-5 h-[100%]'>
                    {highQuickView &&
                        <div value className='quickViewContainer'>
                            <div value={''} onClick={highQuickViewChange} className='quickViewBg'></div>
                            <div className='quickViewDiv h-fit flex items-center p-[1.5%]'>
                                    <div value={''} onClick={highQuickViewChange} className='quickViewCloseBtn absolute'>
                                        <FontAwesomeIcon icon={faX} />
                                    </div>    
                                <div className='quickViewImg h-fit w-1/2 bg-[#f1f1ef]'>
                                    <img className='w-full' src={`${window.location.toString().slice(0,-3)}${highQuickVal[0].img.substr(1)}`}/>
                                </div>
                                <div className='quickViewContent w-1/2 px-[3%]'>
                                    <h2 className='text-3xl pb-5'>{highQuickVal[0].name}</h2>
                                        <Rating className='pb-5' name="half-rating-read " value={highQuickVal[0].rating || 0} precision={0.5} readOnly/>
                                    <p className='pb-5 font-semibold'>Auctor eros suspendisse tellus venenatis sodales purus non pellentesque amet,
                                    nunc sit eu, enim fringilla egestas pulvinar odio feugiat consectetur egestas magna
                                    pharetra cursus risus, lectus enim eget eu et lobortis faucibus.</p>
                                        <p className='pb-5 font-semibold'>SIZE: {shoesSize || 35} </p>
                                        <select onChange={sizeChanging} defaultValue={35} className='size w-[100%] border p-2 mb-5'>
                                            <option value='35'>35</option>
                                            <option value='36'>36</option>
                                            <option value='37'>37</option>
                                            <option value='38'>38</option>
                                            <option value='39'>39</option>
                                            <option value='40'>40</option>
                                            <option value='41'>41</option>
                                            <option value='42'>42</option>
                                            <option value='43'>43</option>
                                            <option value='44'>44</option>
                                            <option value='45'>45</option>
                                        </select>
                                        <h4 className='text-2xl pb-5'>{
                                          highQuickVal[0].price.new == highQuickVal[0].price.old ? '$'+ highQuickVal[0].price.old :
                                        (
                                            <div className='flex'>
                                                <p className='line-through text-gray-300 me-2'>${highQuickVal[0].price.old}</p>
                                                <p className='text-black'>${highQuickVal[0].price.new}</p>
                                            </div>
                                        )
                                    }</h4>
                                        <div className='addToCartContainer flex justify-between pb-[8%] border-b border-gray-200'>
                                            <div className='flex h-fit'>
                                                <div onClick={removeShoes} className='select-none border px-3 pb-1 text-3xl cursor-pointer'>-</div>
                                                <div  className='border px-3 pt-1.5 text-xl'>{shoesNum || 1}</div>
                                                <div onClick={addShoes} className='select-none border px-3 pb-1 text-3xl cursor-pointer'>+</div>
                                            </div>
                                            <button onClick={addToCart} className='bg-[#6e7051] rounded-sm whitespace-nowrap text-white px-5'>ADD TO CART</button>
                                        </div>
                                        <div className='productShare flex gap-x-5 pt-[5%]'>
                                            <p className='font-semibold -mt-1'>SHARE: </p>
                                            <FontAwesomeIcon className='text-xl cursor-pointer' icon={faEnvelope} />
                                            <FontAwesomeIcon className='text-xl cursor-pointer' icon={faPinterestP} />
                                            <FontAwesomeIcon className='text-xl cursor-pointer' icon={faXTwitter} />
                                            <FontAwesomeIcon className='text-xl cursor-pointer' icon={faFacebook} />
                                            <FontAwesomeIcon className='text-xl cursor-pointer' icon={faInstagram} />
                                        </div>    
                                </div>
                            </div>
                        </div>
                    }
                    {filteredShoes.map((item,index) =>
                        <div key={item.name} value={index} className='text-center flex flex-col relative '>
                            <img  value={index} onClick={highQuickViewChange} className='cursor-pointer hover:scale-[1.02] duration-[0.7s]' src={`${window.location.toString().slice(0,-3)}${item.img.substr(1)}`}/>
                            <h5  value={index} onClick={highQuickViewChange} className='cursor-pointer text-xl pt-3'>{item.name}</h5>
                            <div className='flex justify-center pt-3'>
                                {
                                    item.price.old == item.price.new ?
                                    <p className='text-gray-500 font-bold'>${item.price.old}</p> :
                                    <>
                                    <div className='sale bg-[#6e7051]'>Sale!</div>
                                    <p className='line-through text-gray-200 font-bold me-2'>${item.price.old}</p>
                                    <p className='text-gray-500 font-bold'>${item.price.new}</p>
                                </>
                                }
                            </div>
                            <div className='pt-3'>
                            <Rating name="half-rating-read" value={item.rating || 0} precision={0.5} readOnly />
                            </div>
                        </div>
                )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
