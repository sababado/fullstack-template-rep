import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../Card/Card';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('shows the title, description, and action', () => {
    render(
      <EmptyState title="Nothing here" description="Add one." action={<button>Add</button>} />,
    );

    expect(screen.getByText('Nothing here')).toBeInTheDocument();
    expect(screen.getByText('Add one.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
  });
});

describe('Card', () => {
  it('renders a titled region', () => {
    render(
      <Card aria-labelledby="card-title">
        <CardHeader>
          <CardTitle id="card-title">Plan</CardTitle>
          <CardDescription>Today</CardDescription>
        </CardHeader>
        <CardContent>Body</CardContent>
        <CardFooter>Footer</CardFooter>
      </Card>,
    );

    expect(screen.getByRole('region', { name: 'Plan' })).toHaveTextContent('PlanTodayBodyFooter');
  });
});
