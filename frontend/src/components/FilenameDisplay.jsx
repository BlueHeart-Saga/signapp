import React, { forwardRef } from 'react';
import { Tooltip, Box } from '@mui/material';

/**
 * Helper function to middle-truncate a filename string based on a maximum character count.
 * Preserves the file extension when present.
 * Example: "NHSS_Alumni_Management_Platform_Presentation_2026.pdf" -> "NHSS_Alumni_Managemen...pdf"
 */
export function formatMiddleTruncate(filename, maxLength = 20, middleTruncate = true) {
  if (!filename || typeof filename !== 'string') return '';
  if (filename.length <= maxLength) return filename;

  const lastDotIndex = filename.lastIndexOf('.');
  const hasExt = lastDotIndex > 0 && (filename.length - lastDotIndex) <= 8;

  if (!hasExt) {
    // No short extension, truncate with standard ellipsis
    return `${filename.slice(0, Math.max(1, maxLength - 3))}...`;
  }

  const extension = filename.slice(lastDotIndex);
  const baseName = filename.slice(0, lastDotIndex);
  const availableForBase = maxLength - extension.length - 3; // 3 for '...'

  if (availableForBase <= 3) {
    // If not enough room for base name, return truncated base + ext
    return `${baseName.slice(0, Math.max(1, availableForBase))}...${extension}`;
  }

  if (middleTruncate) {
    // Front-heavy middle truncation preserving extension
    const frontChars = Math.ceil(availableForBase * 0.7);
    const backChars = Math.floor(availableForBase * 0.3);

    if (backChars >= 2) {
      return `${baseName.slice(0, frontChars)}...${baseName.slice(-backChars)}${extension}`;
    }
  }

  return `${baseName.slice(0, availableForBase)}...${extension}`;
}

/**
 * FilenameDisplay component:
 * Provides universal, responsive filename truncation with full tooltip support.
 * Uses string-based character truncation (default 20 chars) and/or CSS flex-based
 * truncation so filenames display with clean ellipsis while preserving extension.
 */
const FilenameDisplay = forwardRef(function FilenameDisplay(
  {
    filename = '',
    maxLength = 20,
    middleTruncate = true,
    showTooltip = true,
    tooltipPlacement = 'top',
    tooltipProps = {},
    className = '',
    sx = {},
    onClick,
    style = {},
    asLink = false,
    as,
    component = 'span',
    tabIndex,
    fullWidth = false,
    ...rest
  },
  ref
) {
  const resolvedComponent = as || component || 'span';

  if (!filename) {
    return (
      <span ref={ref} className={className} style={style}>
        Untitled
      </span>
    );
  }

  // Determine extension and base name
  const lastDotIndex = filename.lastIndexOf('.');
  const hasExt = lastDotIndex > 0 && (filename.length - lastDotIndex) <= 8;
  const baseName = hasExt ? filename.slice(0, lastDotIndex) : filename;
  const extension = hasExt ? filename.slice(lastDotIndex) : '';

  // If a fixed maxLength is specified (default: 20 chars), use string-level truncation
  // If explicitly passed false/0/null, string truncation is bypassed for pure container-width truncation
  const shouldTruncateString = typeof maxLength === 'number' && maxLength > 0;
  const displayString = shouldTruncateString
    ? formatMiddleTruncate(filename, maxLength, middleTruncate)
    : null;

  // Determine accessible tabIndex: focusable by default if tooltip is active or clickable
  const resolvedTabIndex =
    tabIndex !== undefined
      ? tabIndex
      : onClick
      ? 0
      : showTooltip
      ? 0
      : undefined;

  const content = (
    <Box
      ref={ref}
      component={resolvedComponent}
      className={`filename-display ${className}`}
      onClick={onClick}
      tabIndex={resolvedTabIndex}
      role={onClick ? 'button' : undefined}
      aria-label={filename}
      sx={{
        display: fullWidth ? 'flex' : 'inline-flex',
        alignItems: 'baseline',
        maxWidth: '100%',
        minWidth: 0,
        verticalAlign: 'bottom',
        cursor: onClick ? 'pointer' : 'inherit',
        textDecoration: asLink ? 'underline' : 'none',
        '&:focus-visible': {
          outline: '2px solid #0f766e',
          outlineOffset: '2px',
          borderRadius: '4px',
        },
        ...sx,
      }}
      style={style}
      title={!showTooltip ? filename : undefined}
      {...rest}
    >
      {displayString ? (
        <span
          className="filename-truncated"
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            minWidth: 0,
            maxWidth: '100%',
            display: 'inline-block',
          }}
        >
          {displayString}
        </span>
      ) : middleTruncate && hasExt ? (
        <>
          <span
            className="filename-base"
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              minWidth: 0,
              flexShrink: 1,
            }}
          >
            {baseName}
          </span>
          <span
            className="filename-ext"
            style={{
              flexShrink: 0,
              whiteSpace: 'nowrap',
            }}
          >
            {extension}
          </span>
        </>
      ) : (
        <span
          className="filename-full"
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            minWidth: 0,
            maxWidth: '100%',
            display: 'inline-block',
          }}
        >
          {filename}
        </span>
      )}
    </Box>
  );

  if (showTooltip) {
    return (
      <Tooltip
        title={filename}
        arrow
        placement={tooltipPlacement}
        enterDelay={250}
        enterTouchDelay={50}
        leaveTouchDelay={3500}
        {...tooltipProps}
      >
        {content}
      </Tooltip>
    );
  }

  return content;
});

export default FilenameDisplay;
