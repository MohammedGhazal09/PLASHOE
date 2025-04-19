// Sorter.js
import * as React from 'react';
import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';

export default function Sorter({ onSortChange }) {
  const [sortOption, setSortOption] = React.useState('');
  const handleChange = (event) => {
    const selectedOption = event.target.value;
    setSortOption(selectedOption);
    onSortChange(selectedOption); // Notify parent component about the selected sort option
  };

  return (
    <Box sx={{ minWidth: 100}}>
      <FormControl fullWidth>
        <InputLabel id="demo-simple-select-label">Sort</InputLabel>
        <Select
          labelId="demo-simple-select-label"
          id="demo-simple-select"
          value={sortOption}
          label="Sort"
          onChange={handleChange}
          sx={{width:"100%",
            "@media (max-width: 430px)": {
              width:"120px"
            }
          }}
          
        >
          <MenuItem value="rating">Rating</MenuItem>
          <MenuItem value="priceLowToHigh">Price: Low to High</MenuItem>
          <MenuItem value="priceHighToLow">Price: High to Low</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
}
