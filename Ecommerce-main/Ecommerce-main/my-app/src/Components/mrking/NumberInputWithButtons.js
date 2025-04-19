// NumberInputWithButtons.js

import React from "react";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";

export default function NumberInputWithButtons({ min, max, step = 1, value = min, onChange, label }) {
  // Log the value to debug whether it's correctly received by the component

  const handleIncrement = () => {
    if (value + step <= max) {
      onChange(value + step);
    }
  };

  const handleDecrement = () => {
    if (value - step >= min) {
      onChange(value - step);
    }
  };

  const handleInputChange = (e) => {
    const newValue = Number(e.target.value);
    if (newValue >= min && newValue <= max) {
      onChange(newValue);
    }
  };

  return (
    <TextField
      variant="outlined"
      type="number"
      value={value} // Ensure a valid number is passed as value
      onChange={handleInputChange}
      label={label || ""}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start" >
            <IconButton
              size="small"
              onClick={handleDecrement}
              disabled={value <= min}
              sx={{ padding: "2px" }}
            >
              <RemoveIcon fontSize="inherit" />
            </IconButton>
          </InputAdornment>
        ),
        endAdornment: (
          <InputAdornment position="end">
            <IconButton
              size="small"
              onClick={handleIncrement}
              disabled={value >= max}
              sx={{ padding: "2px" }}
            >
              <AddIcon fontSize="inherit" />
            </IconButton>
          </InputAdornment>
        ),
        inputProps: { min, max, step },
      }}
      sx={{
        width: 120,
        "& .MuiInputBase-root": {
          fontSize: 12,
          padding: "4px 8px",
        },
        "& .MuiInputLabel-root": {
          fontSize: 10,
        },
        "& .MuiOutlinedInput-root": {
          "& fieldset": {
            borderRadius: "4px",
          },
        },
      }}
    />
  );
}
