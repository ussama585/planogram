import {
  ButtonBase,
  Checkbox,
  ClickAwayListener,
  InputBase,
  Paper,
  Popper
} from "@mui/material";

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import SearchIcon from '@mui/icons-material/Search';

import { useMemo, useRef, useState } from "react";

const MultiSelectFilter = ({
  label,
  allLabel,
  searchPlaceholder,
  options,
  value,
  onChange
}) => {
  const anchorRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const visibleOptions = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    if (!normalizedSearch) {
      return options;
    }

    return options.filter((option) =>
      option.label.toLowerCase().includes(normalizedSearch)
    );
  }, [options, searchValue]);

  const selectedAll =
    options.length > 0 && value.length === options.length;

  const triggerText = selectedAll
    ? allLabel
    : value.length === 0
      ? "None"
      : `${value.length} selected`;

  const toggleOption = (optionValue) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((selectedValue) => selectedValue !== optionValue));
      return;
    }

    onChange([...value, optionValue]);
  };

  const handleClose = (event) => {
    if (anchorRef.current?.contains(event.target)) {
      return;
    }

    setOpen(false);
  };

  return (
    <div className="de-filter-control">
      <span className="de-filter-label">{label}</span>

      <ButtonBase
        ref={anchorRef}
        className={`de-select-trigger ${open ? "is-open" : ""}`}
        onClick={() => setOpen((currentValue) => !currentValue)}
      >
        <span className="de-select-trigger-text">{triggerText}</span>

        {open ? (
          <ExpandLessIcon size={16} stroke={2.2} />
        ) : (
          <ExpandMoreIcon size={16} stroke={2.2} />
        )}
      </ButtonBase>

      <Popper
        open={open}
        anchorEl={anchorRef.current}
        placement="bottom-start"
        style={{
          width: anchorRef.current?.offsetWidth,
          zIndex: 1400
        }}
      >
        <ClickAwayListener onClickAway={handleClose}>
          <Paper className="de-select-menu" elevation={0}>
            <div className="de-select-search">
              <SearchIcon size={17} />

              <InputBase
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder={searchPlaceholder}
                fullWidth
              />
            </div>

            <div className="de-select-options">
              {visibleOptions.length > 0 ? (
                visibleOptions.map((option) => (
                  <ButtonBase
                    key={option.value}
                    className="de-select-option"
                    onClick={() => toggleOption(option.value)}
                  >
                    <Checkbox
                      checked={value.includes(option.value)}
                      size="small"
                      disableRipple
                    />

                    <span>{option.label}</span>
                  </ButtonBase>
                ))
              ) : (
                <div className="de-select-empty">No options found</div>
              )}
            </div>

            <div className="de-select-footer">
              <ButtonBase
                className="de-select-footer-button"
                onClick={() =>
                  onChange(options.map((option) => option.value))
                }
              >
                All
              </ButtonBase>

              <ButtonBase
                className="de-select-footer-button"
                onClick={() => onChange([])}
              >
                None
              </ButtonBase>
            </div>
          </Paper>
        </ClickAwayListener>
      </Popper>
    </div>
  );
};

export default MultiSelectFilter;