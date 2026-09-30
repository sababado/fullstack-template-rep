import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../../atoms/Button/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './Card';

function Example() {
  return (
    <Card className="max-w-sm">
      <CardHeader>
        <CardTitle>Weekly plan</CardTitle>
        <CardDescription>Updated 2 hours ago</CardDescription>
      </CardHeader>
      <CardContent>Ship the notes feature and write the runbook.</CardContent>
      <CardFooter>
        <Button size="sm" variant="outline">
          Edit
        </Button>
      </CardFooter>
    </Card>
  );
}

const meta = { title: 'Molecules/Card', component: Example } satisfies Meta<typeof Example>;

export default meta;
export const Default: StoryObj<typeof meta> = {};
export const Dark: StoryObj<typeof meta> = { globals: { theme: 'dark' } };
