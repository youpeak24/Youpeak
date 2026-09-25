import React from "react";
import TablePagination from "react-js-pagination";

const Pagination = (props) => {
  const {
    type,
    setPage,
    userTotal,
    rowsPerPage,
    activePage,
  } = props;

  const handlePage = (pageNumber) => {
    if (props.handlePageChange) {
      props.handlePageChange(pageNumber);
    } else {
      setPage(pageNumber);
    }
  };

  const startIndex = userTotal === 0 ? 0 : (activePage - 1) * rowsPerPage + 1;
  const endIndex = userTotal === 0 ? 0 : Math.min(activePage * rowsPerPage, userTotal);

  const renderLimitAndText = () => (
    <div className="pagination-limit-text">
      {props.handleRowsPerPage && (
        <div className="pagination-select">
          <select
            value={rowsPerPage}
            onChange={(e) => props.handleRowsPerPage(parseInt(e.target.value))}
          >
            <option value={10}>10 / page</option>
            <option value={25}>25 / page</option>
            <option value={50}>50 / page</option>
            <option value={100}>100 / page</option>
          </select>
        </div>
      )}
      <p className="pagination-text">
        {startIndex}–{endIndex} of {userTotal}
      </p>
    </div>
  );

  return (
    <>
      {userTotal > 0 && (
        <div className="custom-pagination px-3">
          {type === "server" && userTotal > 0 && (
            <div className="pagination-wrapper">
              {renderLimitAndText()}
              <TablePagination
                activePage={activePage}
                itemsCountPerPage={rowsPerPage}
                totalItemsCount={userTotal}
                pageRangeDisplayed={3}
                onChange={(page) => handlePage(page)}
                itemClass="page-item"
                linkClass="page-link"
                firstPageText="«"
                prevPageText="‹"
                nextPageText="›"
                lastPageText="»"
              />
            </div>
          )}
          {type === "client" && userTotal > 0 && (
            <div className="pagination-wrapper">
              {renderLimitAndText()}
              <TablePagination
                activePage={activePage}
                itemsCountPerPage={rowsPerPage}
                totalItemsCount={userTotal}
                pageRangeDisplayed={3}
                onChange={handlePage}
                itemClass="page-item"
                linkClass="page-link"
                firstPageText="«"
                prevPageText="‹"
                nextPageText="›"
                lastPageText="»"
              />
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default Pagination;