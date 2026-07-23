import { useEffect, useState } from 'react';

import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

export default function ServerTable({
  columns = [],
  rows = [],
  getRowId = (row) => row?.id,
  loading = false,
  error = null,
  emptyMessage = 'No records found.',
  searchValue = '',
  searchPlaceholder = 'Search...',
  onSearchChange,
  page = 0,
  rowsPerPage = 10,
  rowsPerPageOptions = [10, 25, 50, 100],
  totalCount = 0,
  onPageChange,
  onRowsPerPageChange,
  searchDelay = 500
}) {
  const [searchInput, setSearchInput] = useState(searchValue); 

  useEffect(() => {
    setSearchInput(searchValue);
  }, [searchValue]);

  useEffect(() => {
    if (!onSearchChange) return;

    const normalizedInput = String(searchInput || '').trim();
    const normalizedSearchValue = String(searchValue || '').trim();

    if (normalizedInput === normalizedSearchValue) {
      return;
    }

    const timeout = setTimeout(() => {
      onSearchChange(normalizedInput);
    }, searchDelay);

    return () => {
      clearTimeout(timeout);
    };
  }, [
    searchInput,
    searchValue,
    searchDelay,
    onSearchChange
  ]);

  const handlePageChange = (_, newPage) => {
    onPageChange?.(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    onRowsPerPageChange?.(Number(event.target.value));
  };

  return (
    <Paper variant="outlined">
      {onSearchChange && (
        <Box sx={{ p: 2, maxWidth: 300 }}>
          <TextField
            fullWidth
            size="small"
            value={searchInput}
            placeholder={searchPlaceholder}
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </Box>
      )}

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align || 'left'}
                  sx={column.sx}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <Stack
                    alignItems="center"
                    justifyContent="center"
                    sx={{ py: 6 }}
                  >
                    <CircularProgress size={30} />
                  </Stack>
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <Stack
                    alignItems="center"
                    justifyContent="center"
                    sx={{ py: 6 }}
                  >
                    <Typography color="error">
                      {error?.message || 'Failed to load records.'}
                    </Typography>
                  </Stack>
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center">
                  <Typography color="text.secondary" sx={{ py: 4 }}>
                    {emptyMessage}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, rowIndex) => (
                <TableRow
                  key={getRowId(row) ?? rowIndex}
                  hover
                >
                  {columns.map((column) => (
                    <TableCell
                      key={column.id}
                      align={column.align || 'left'}
                      sx={column.cellSx}
                    >
                      {column.render
                        ? column.render(row, rowIndex)
                        : row?.[column.id] ?? '-'}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={totalCount}
        page={page}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={rowsPerPageOptions}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
      />
    </Paper>
  );
}