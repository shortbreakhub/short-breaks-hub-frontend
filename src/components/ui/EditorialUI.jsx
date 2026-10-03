import React, {useId} from "react";
import {Link} from "react-router-dom";

const classes = (...values) => values.filter(Boolean).join(" ");
const heading = level => {
    if (!Number.isInteger(level) || level < 1 || level > 6) throw new Error("Use a heading level from 1 to 6.");
    return `h${level}`;
};

// Activate tokens/styles only inside an explicitly migrated editorial area.
export function EditorialSurface({children, className, ...props}) {
    return <div {...props} className={classes("sbh-editorial", className)}>{children}</div>;
}
export function Container({reading = false, className, ...props}) {
    return <div {...props} className={classes("sbh-container", reading && "sbh-container--reading", className)} />;
}
export function Section({className, ...props}) {
    return <section {...props} className={classes("sbh-section", className)} />;
}
export function CardGrid({className, ...props}) {
    return <div {...props} className={classes("sbh-grid", className)} />;
}

function DestinationLink({to, href, disabled, children, onClick, ...props}) {
    if ((to == null) === (href == null)) throw new Error("Provide exactly one navigation destination: to or href.");
    if (disabled) return <a {...props} role="link" aria-disabled="true" tabIndex={-1}
        onClick={event => event.preventDefault()} onKeyDown={event => {
            if (event.key === "Enter" || event.key === " ") event.preventDefault();
        }}>{children}</a>;
    if (to != null) return <Link {...props} to={to} onClick={onClick}>{children}</Link>;
    return <a {...props} href={href} onClick={onClick}
        rel={props.rel ?? (props.target === "_blank" ? "noopener noreferrer" : undefined)}>{children}</a>;
}

export function Action({to, href, variant = "primary", iconOnly = false, disabled = false,
    className, children, type = "button", ...props}) {
    if (iconOnly && !props["aria-label"]) throw new Error("Icon actions require a translated aria-label.");
    const actionClass = classes("sbh-action", `sbh-action--${variant}`, iconOnly && "sbh-action--icon", className);
    if (to != null || href != null) return <DestinationLink {...props} to={to} href={href}
        disabled={disabled} className={actionClass}>{children}</DestinationLink>;
    return <button {...props} type={type} disabled={disabled} className={actionClass}>{children}</button>;
}

export function EditorialLink({navigation = false, className, ...props}) {
    return <DestinationLink {...props} className={classes("sbh-link", navigation && "sbh-link--navigation", className)} />;
}

export function SectionHeader({eyebrow, title, description, action, headingLevel = 2, id}) {
    const Heading = heading(headingLevel);
    return <header className="sbh-section-header">
        <div>
            {eyebrow && <p className="sbh-kicker">{eyebrow}</p>}
            <Heading id={id} className="sbh-section-title">{title}</Heading>
            {description && <p className="sbh-support">{description}</p>}
        </div>
        {action}
    </header>;
}

// Pass optimized delivery metadata explicitly; there is no image inventory import.
export function Media({src, alt, srcSet, sizes, width, height, loading = "lazy", ratio = "4 / 3",
    position = "center", overlay, className, ...imageProps}) {
    if (typeof alt !== "string") throw new Error("Media requires explicit alt text; use an empty string only for decorative images.");
    return <div className={classes("sbh-media", className)} style={{aspectRatio: ratio}}>
        <img {...imageProps} src={src} alt={alt} srcSet={srcSet} sizes={sizes} width={width} height={height}
            loading={loading} decoding="async" style={{...imageProps.style, objectPosition: position}} />
        {overlay && <div className="sbh-media-overlay">{overlay}</div>}
    </div>;
}

// One photographic content foundation, rather than six domain-specific wrappers.
// Link the title only: cards may contain other independent actions without nested links.
export function ContentCard({title, to, href, media, eyebrow, metadata, description, action, headingLevel = 3, className}) {
    const Heading = heading(headingLevel);
    return <article className={classes("sbh-card", className)}>
        {media && <Media {...media} />}
        <div className="sbh-card-body">
            {eyebrow && <p className="sbh-kicker">{eyebrow}</p>}
            <Heading className="sbh-card-title">
                {to != null || href != null ? <DestinationLink to={to} href={href} className="sbh-card-link">{title}</DestinationLink> : title}
            </Heading>
            {metadata && <Metadata items={metadata} />}
            {description && <p className="sbh-support">{description}</p>}
            {action}
        </div>
    </article>;
}

export function Badge({children, tone = "neutral"}) {
    return <span className={classes("sbh-badge", tone === "success" && "sbh-badge--success")}>{children}</span>;
}
export function Metadata({items}) {
    return <ul role="list" className="sbh-metadata">{items.map((item, index) => <li key={index}>{item}</li>)}</ul>;
}

// Native control semantics, values, constraints and handlers stay with the caller.
export function Field({label, hint, error, id, as = "input", className, children, ...props}) {
    if (!["input", "select", "textarea"].includes(as)) throw new Error("Field supports native input, select or textarea controls.");
    const generatedId = useId();
    const controlId = id || generatedId;
    const describedBy = classes(props["aria-describedby"], hint && `${controlId}-hint`, error && `${controlId}-error`) || undefined;
    const Control = as;
    return <div className={classes("sbh-field", className)}>
        <label className="sbh-label" htmlFor={controlId}>{label}</label>
        <Control {...props} id={controlId} className="sbh-control" aria-describedby={describedBy}
            aria-invalid={error ? true : props["aria-invalid"]}>{children}</Control>
        {hint && <p id={`${controlId}-hint`} className="sbh-meta">{hint}</p>}
        {error && <p id={`${controlId}-error`} className="sbh-field-error" role="alert">{error}</p>}
    </div>;
}

export function ContentState({kind = "empty", title, description, action, headingLevel = 3}) {
    const Heading = heading(headingLevel);
    return <div className={classes("sbh-state", `sbh-state--${kind}`)}
        role={kind === "error" ? "alert" : kind === "loading" ? "status" : undefined}
        aria-busy={kind === "loading" ? true : undefined}>
        <Heading className="sbh-card-title">{title}</Heading>
        {description && <p className="sbh-support">{description}</p>}
        {action}
    </div>;
}
