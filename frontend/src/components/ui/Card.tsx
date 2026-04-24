import React from 'react';
import { cn } from '../../utils/cn';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  onClick?: () => void;
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
  title?: string;
  subtitle?: string;
}

interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
}

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> & {
  Header: React.FC<CardHeaderProps>;
  Body: React.FC<CardBodyProps>;
  Footer: React.FC<CardFooterProps>;
} = ({ children, className, padding = 'md', hover = false, onClick }) => {
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-gray-200 shadow-sm',
        paddings[padding],
        hover && 'hover:shadow-md transition-shadow cursor-pointer',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

const CardHeader: React.FC<CardHeaderProps> = ({ children, className, action, title, subtitle }) => (
  <div className={cn('flex items-start justify-between mb-4', className)}>
    <div>
      {title && <h3 className="text-base font-semibold text-gray-900">{title}</h3>}
      {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      {children}
    </div>
    {action && <div className="ml-4 flex-shrink-0">{action}</div>}
  </div>
);

const CardBody: React.FC<CardBodyProps> = ({ children, className }) => (
  <div className={cn(className)}>{children}</div>
);

const CardFooter: React.FC<CardFooterProps> = ({ children, className }) => (
  <div className={cn('pt-4 mt-4 border-t border-gray-100', className)}>{children}</div>
);

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;
