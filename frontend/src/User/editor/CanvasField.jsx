import React, { useRef, useEffect, useCallback } from 'react';
import { Group, Rect, Text, Circle, Line, Transformer } from 'react-konva';
import { FIELD_TYPES, getRecipientColor } from '../../config/fieldConfig';

// Map field types to display text
const getFieldDisplayText = (field) => {
  switch (field.type) {
    case 'signature': return 'SIGNATURE';
    case 'initials': return 'INI';
    case 'date': return 'DATE';
    case 'textbox': return 'TEXT';
    case 'checkbox': return '✓';
    case 'radio': return '○';
    case 'dropdown': return '▼';
    case 'attachment': return '📎';
    case 'approval': return 'APPROVE';
    case 'witness_signature': return 'WITNESS SIGN';
    case 'stamp': return 'STAMP';
    case 'mail': return '✉';
    default: return 'FIELD';
  }
};

const CanvasField = ({
  field,
  isSelected,
  onSelect,
  onDragEnd,
  onTransform,
  scale = 1,
  validationError = false,
  currentPage = 0,
  showAllFields = false,
  pageOffsetY = 0,
  recipients = []
}) => {
  const shapeRef = useRef();
  const transformerRef = useRef();
  const isDraggingRef = useRef(false);

  useEffect(() => {
    if (isSelected && transformerRef.current && shapeRef.current) {
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  const handleClick = (e) => {
    e.cancelBubble = true;
    e.evt.preventDefault();
    onSelect(field.id);
  };

  const handleDragStart = () => {
    isDraggingRef.current = false;
  };

  const handleDragMove = (e) => {
    const dx = e.target.x() - (field.x * scale);
    const dy = e.target.y() - (field.y * scale + pageOffsetY);
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 2) {
      isDraggingRef.current = true;
    }
  };

  const handleDragEnd = (e) => {
    const newX = e.target.x() / scale;
    const newY = (e.target.y() - pageOffsetY) / scale;

    // Constrain to canvas boundaries
    const constrainedX = Math.max(0, Math.min(newX, 794 - field.width));
    const constrainedY = Math.max(0, Math.min(newY, 1123 - field.height));

    onDragEnd(field.id, Math.round(constrainedX), Math.round(constrainedY));
  };

  const handleTransformEnd = () => {
    const node = shapeRef.current;

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    const newWidth = Math.max(30, node.width() * scaleX);
    const newHeight = Math.max(30, node.height() * scaleY);

    // reset scale BEFORE saving
    node.scaleX(1);
    node.scaleY(1);

    node.width(newWidth);
    node.height(newHeight);

    const newX = node.x();
    const newY = node.y();

    onTransform(field.id, {
      width: Math.round(newWidth / scale),
      height: Math.round(newHeight / scale),
      x: Math.round(newX / scale),
      y: Math.round((newY - pageOffsetY) / scale)
    });
  };

  useEffect(() => {
    if (isSelected && transformerRef.current && shapeRef.current) {
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [isSelected, field.width, field.height]);

  const dragBoundFunc = useCallback((pos) => {
    const fieldWidth = field.width * scale;
    const fieldHeight = field.height * scale;

    const constrainedX = Math.max(0, Math.min(pos.x, 794 * scale - fieldWidth));
    const constrainedY = Math.max(pageOffsetY, Math.min(pos.y, pageOffsetY + 1123 * scale - fieldHeight));

    return {
      x: constrainedX,
      y: constrainedY
    };
  }, [field.width, field.height, scale, pageOffsetY]);

  const fieldType = FIELD_TYPES[field.type] || FIELD_TYPES.textbox;
  const isCurrentPage = field.page === currentPage;
  const isOtherPage = field.page !== currentPage;
  const opacity = showAllFields && !isCurrentPage ? 0.3 : 1;

  const assignedRecipient = field.assignedRecipient ||
    (field.recipient_id ? recipients.find(r => r.id === field.recipient_id) : null);

  const recipientColor = assignedRecipient ? getRecipientColor(assignedRecipient) : fieldType.color;

  // Helper to add alpha to hex color
  const addAlphaToHex = (hex, alphaHex) => {
    if (!hex) return '#80808080';
    hex = hex.replace('#', '');
    if (hex.length === 3) {
      hex = hex.split('').map(char => char + char).join('');
    }
    if (hex.length !== 6) {
      hex = '808080';
    }
    return `#${hex}${alphaHex}`;
  };

  const getFillColor = (baseColor, alphaHex, defaultColor) => {
    if (assignedRecipient && baseColor) {
      return addAlphaToHex(baseColor, alphaHex);
    }
    return defaultColor;
  };

  // Render field content based on type with Zoho-like design
  const renderFieldContent = () => {

    const textColor = validationError ? '#FF0000' : (assignedRecipient ? recipientColor : '#666666');
    const displayText = getFieldDisplayText(field);

    const borderColor = validationError
      ? '#d32f2f'
      : recipientColor;

    const bgColor = validationError
      ? '#fff5f5'
      : assignedRecipient
        ? addAlphaToHex(recipientColor, '15') // light tint
        : '#ffffff';

    const fitFontSize = Math.min(
      14 * scale,
      (field.width * scale) / (displayText.length * 0.6)
    );

    // Base rectangle for all fields
    const baseRect = (
      <Group>
        {/* Main field box */}
        <Rect
          width={Math.max(30, field.width * scale)}
          height={Math.max(30, field.height * scale)}
          fill={bgColor}
          stroke={borderColor}
          strokeWidth={isSelected ? 2.5 : 1.6}
          cornerRadius={8}

        />

        {/* Field label */}
        <Text
          text={displayText}
          width={field.width * scale}
          height={field.height * scale}
          align="center"
          verticalAlign="middle"
          fontSize={fitFontSize}
          fontStyle="bold"
          fill="#344054"
        />
      </Group>
    );

    // Type-specific content
    const fieldContent = (() => {
      switch (field.type) {
        case 'signature':
          return (
            <>
              {/* <Text
                x={(field.width * scale) / 2}
                y={(field.height * scale) / 2 - 6 * scale}
                text="✍️"
                fontSize={16 * scale}
                align="center"
                verticalAlign="middle"
                fill={textColor}
              /> */}
              <Text
                x={(field.width * scale) / 2}
                y={(field.height * scale) / 2 + 10 * scale}
                text="SIGN HERE"
                fontSize={8 * scale}
                align="center"
                verticalAlign="middle"
                fill={textColor}
                fontStyle="bold"
              />
            </>
          );

        case 'witness_signature':
          return (
            <>
              {/* <Text
                x={(field.width * scale) / 2}
                y={(field.height * scale) / 2 - 6 * scale}
                text="👤"
                fontSize={16 * scale}
                align="center"
                verticalAlign="middle"
                fill={textColor}
              /> */}
              <Text
                x={(field.width * scale) / 2}
                y={(field.height * scale) / 2 + 10 * scale}
                text="WITNESS"
                fontSize={8 * scale}
                align="center"
                verticalAlign="middle"
                fill={textColor}
                fontStyle="bold"
              />
            </>
          );

        case 'approval':
          return (
            <>
              {/* <Text
                x={(field.width * scale) / 2}
                y={(field.height * scale) / 2 - 6 * scale}
                text="✓"
                fontSize={18 * scale}
                align="center"
                verticalAlign="middle"
                fill={textColor}
                fontStyle="bold"
              /> */}
              <Text
                x={(field.width * scale) / 2}
                y={(field.height * scale) / 2 + 10 * scale}
                text="APPROVE"
                fontSize={7 * scale}
                align="center"
                verticalAlign="middle"
                fill={textColor}
              />
            </>
          );

        case 'initials':
          return (
            <Text
              x={(field.width * scale) / 2}
              y={(field.height * scale) / 2}
              text="INI"
              fontSize={11 * scale}
              align="center"
              verticalAlign="middle"
              fill={textColor}
              fontStyle="bold"
            />
          );

        case 'checkbox':
          return (
            <>
              <Rect
                x={4 * scale}
                y={4 * scale}
                width={(field.width - 8) * scale}
                height={(field.height - 8) * scale}
                fill="white"
                stroke={borderColor}
                strokeWidth={1}
                cornerRadius={2}
              />
              <Line
                points={[
                  8 * scale, (field.height / 2) * scale,
                  (field.width / 2 - 2) * scale, (field.height - 8) * scale,
                  (field.width - 8) * scale, 8 * scale
                ]}
                stroke={borderColor}
                strokeWidth={2}
                visible={field.checked}
              />
            </>
          );

        case 'radio':
          return (
            <>
              <Circle
                x={(field.width * scale) / 2}
                y={(field.height * scale) / 2}
                radius={Math.min(field.width, field.height) * scale / 2 - 4}
                fill="white"
                stroke={borderColor}
                strokeWidth={1.5}
              />
              {field.checked && (
                <Circle
                  x={(field.width * scale) / 2}
                  y={(field.height * scale) / 2}
                  radius={Math.min(field.width, field.height) * scale / 4}
                  fill={borderColor}
                />
              )}
            </>
          );

        case 'stamp':
          return (
            <>
              <Text
                x={(field.width * scale) / 2}
                y={(field.height * scale) / 2 - 8 * scale}
                text="OFFICIAL"
                fontSize={9 * scale}
                align="center"
                verticalAlign="middle"
                fill={textColor}
                fontStyle="bold"
              />
              <Text
                x={(field.width * scale) / 2}
                y={(field.height * scale) / 2 + 6 * scale}
                text="STAMP"
                fontSize={9 * scale}
                align="center"
                verticalAlign="middle"
                fill={textColor}
                fontStyle="bold"
              />
            </>
          );

        case 'date':
          return (
            <Text
              x={8 * scale}
              y={(field.height * scale) / 2 - 6 * scale}
              text={field.placeholder || "MM/DD/YYYY"}
              fontSize={10 * scale}
              fontFamily="Arial"
              fill={textColor}
              width={(field.width - 16) * scale}
              align="left"
              verticalAlign="middle"
            />
          );

        case 'mail':
          return (
            <Text
              x={8 * scale}
              y={(field.height * scale) / 2 - 6 * scale}
              text={field.placeholder || "✉ email@example.com"}
              fontSize={10 * scale}
              fontFamily="Arial"
              fill={textColor}
              width={(field.width - 16) * scale}
              align="left"
              verticalAlign="middle"
            />
          );

        case 'dropdown':
          return (
            <>
              <Text
                x={8 * scale}
                y={(field.height * scale) / 2 - 6 * scale}
                text={field.placeholder || "Select..."}
                fontSize={10 * scale}
                fontFamily="Arial"
                fill={textColor}
                width={(field.width - 24) * scale}
                align="left"
                verticalAlign="middle"
              />
              <Line
                points={[
                  field.width * scale - 20 * scale, 12 * scale,
                  field.width * scale - 12 * scale, field.height * scale / 2,
                  field.width * scale - 20 * scale, field.height * scale - 12 * scale
                ]}
                stroke={borderColor}
                strokeWidth={1.5}
                fill={borderColor}
              />
            </>
          );

        default: // textbox, attachment
          return (
            <Text
              x={8 * scale}
              y={(field.height * scale) / 2 - 6 * scale}
              text={field.placeholder || fieldType.placeholder}
              fontSize={10 * scale}
              fontFamily="Arial"
              fill={textColor}
              width={(field.width - 16) * scale}
              align="left"
              verticalAlign="middle"
            />
          );
      }
    })();

    return (
      <Group>
        {baseRect}
        {/* {fieldContent} */}
      </Group>
    );
  };

  return (
    <>
      <Group
        ref={shapeRef}
        x={field.x * scale}
        y={field.y * scale + pageOffsetY}
        width={Math.max(30, field.width * scale)}
        height={Math.max(30, field.height * scale)}
        draggable={isCurrentPage || showAllFields}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={isCurrentPage || showAllFields ? handleDragEnd : undefined}
        onClick={handleClick}
        onTap={handleClick}
        onTransformEnd={isCurrentPage ? handleTransformEnd : undefined}
        opacity={opacity}
        dragBoundFunc={dragBoundFunc}
      >
        {/* Page indicator for fields on other pages */}
        {showAllFields && !isCurrentPage && (
          <Group x={field.width * scale - 30} y={-25 * scale}>
            <Circle
              x={0}
              y={0}
              radius={8}
              fill="#666"
              stroke="#FFFFFF"
              strokeWidth={1}
            />
            <Text
              x={0}
              y={0}
              text={`${field.page + 1}`}
              fontSize={8 * scale}
              fontFamily="Arial"
              fill="#FFFFFF"
              align="center"
              verticalAlign="middle"
            />
          </Group>
        )}

        {/* Field content */}
        {renderFieldContent()}

        {/* Field label */}
        {/* <Text
          x={5 * scale}
          y={-20 * scale}
          text={`${assignedRecipient ? assignedRecipient.name.split(' ')[0] + ': ' : ''}${field.label || field.name}${field.required ? ' *' : ''}`}
          fontSize={10 * scale}
          fontFamily="Arial"
          fill={validationError ? '#FF0000' : (isOtherPage ? '#888888' : (assignedRecipient ? recipientColor : '#666666'))}
          width={field.width * scale}
          fontStyle={isSelected ? 'bold' : 'normal'}
        /> */}

        {/* Validation error indicator */}
        {validationError && (
          <Text
            x={5 * scale}
            y={-10 * scale}
            text="Invalid assignment"
            fontSize={8 * scale}
            fontFamily="Arial"
            fill="#FF0000"
          />
        )}

        {/* Recipient indicator */}
      </Group>

      {/* Transformer for selected field */}
      {isSelected && (showAllFields || isCurrentPage) && !validationError && (
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 30 || newBox.height < 30) {
              return oldBox;
            }
            return newBox;
          }}
          enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
          rotateEnabled={false}
          keepRatio={false}
          borderDash={[4, 4]}
          borderStroke={recipientColor}
          anchorFill={recipientColor}
          anchorStroke="#ffffff"
          anchorSize={8}
        />
      )}
    </>
  );
};

export default React.memo(CanvasField);