type BrandFooterProps = {
  className?: string;
};

const BrandFooter = ({ className = "" }: BrandFooterProps) => (
  <footer className={`brand-footer ${className}`.trim()}>
    <div className="brand-footer__inner">
      <div className="brand-footer__logo" aria-label="مجموعة بودل للضيافة">
        <img src="/bhg-hospitality-group.jpg" alt="مجموعة بودل للضيافة" />
      </div>
      <p>إدارة الحجز المركزي</p>
    </div>
  </footer>
);

export default BrandFooter;
