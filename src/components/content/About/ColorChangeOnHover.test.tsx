import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ColorChangeOnHover } from './About';

describe('ColorChangeOnHover', () => {
  it('renders text split into spans with hover-color-change class', () => {
    const text = 'Hello world Hello';
    render(<ColorChangeOnHover text={text} />);

    const spans = screen.getAllByText(/Hello|world/);
    expect(spans).toHaveLength(3);

    spans.forEach(span => {
      expect(span).toHaveClass('hover-color-change');
    });

    // Check occurrences
    expect(spans[0]).toHaveTextContent('Hello');
    expect(spans[1]).toHaveTextContent('world');
    expect(spans[2]).toHaveTextContent('Hello');
  });

  it('handles empty text correctly', () => {
    const { container } = render(<ColorChangeOnHover text="" />);
    expect(container).toBeEmptyDOMElement();
  });
});
