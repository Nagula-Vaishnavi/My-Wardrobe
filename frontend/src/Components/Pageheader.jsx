function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
}) {
  return (
    <div className="page-header">

      <div>
        {eyebrow && (
          <div className="eyebrow">
            {eyebrow}
          </div>
        )}

        <h1>{title}</h1>

        {subtitle && (
          <p>{subtitle}</p>
        )}
      </div>

      {action && action}

    </div>
  );
}

export default PageHeader;