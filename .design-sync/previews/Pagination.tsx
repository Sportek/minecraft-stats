import { Pagination } from "frontend";

export function FirstPage() {
  return (
    <div style={{ padding: 24, width: "100%" }}>
      <Pagination currentPage={1} totalPages={12} onPageChange={() => {}} />
    </div>
  );
}

export function MiddlePage() {
  return (
    <div style={{ padding: 24, width: "100%" }}>
      <Pagination currentPage={6} totalPages={12} onPageChange={() => {}} />
    </div>
  );
}

export function LastPage() {
  return (
    <div style={{ padding: 24, width: "100%" }}>
      <Pagination currentPage={12} totalPages={12} onPageChange={() => {}} />
    </div>
  );
}

export function FewPages() {
  return (
    <div style={{ padding: 24, width: "100%" }}>
      <Pagination currentPage={2} totalPages={4} onPageChange={() => {}} />
    </div>
  );
}
