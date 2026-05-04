import * as React from 'react';
import { cn } from './utils';

export function Card({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('bg-card text-card-foreground flex flex-col gap-5 rounded-xl border', className)} {...props} />;
}

export function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('grid auto-rows-min items-start gap-1.5 px-6 pt-6', className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return <h3 className={cn('leading-none font-semibold tracking-tight', className)} {...props} />;
}

export function CardDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return <p className={cn('text-sm text-muted-foreground', className)} {...props} />;
}

export function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('px-6 pb-6', className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('flex items-center px-6 pb-6', className)} {...props} />;
}
