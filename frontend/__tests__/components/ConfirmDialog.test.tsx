import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ConfirmDialog from '@/components/ConfirmDialog';

describe('ConfirmDialog', () => {
  it('renders nothing when closed', () => {
    render(
      <ConfirmDialog
        open={false}
        title="Eliminar"
        message="¿Seguro?"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />,
    );
    expect(screen.queryByText('Eliminar')).toBeNull();
  });

  it('renders title and message when open', () => {
    render(
      <ConfirmDialog
        open
        title="Eliminar"
        message="¿Seguro que deseas continuar?"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />,
    );
    expect(screen.getByText('Eliminar')).toBeInTheDocument();
    expect(screen.getByText('¿Seguro que deseas continuar?')).toBeInTheDocument();
  });

  it('uses custom confirm and cancel labels', () => {
    render(
      <ConfirmDialog
        open
        title="T"
        message="M"
        confirmLabel="Sí, borrar"
        cancelLabel="No, volver"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />,
    );
    expect(screen.getByText('Sí, borrar')).toBeInTheDocument();
    expect(screen.getByText('No, volver')).toBeInTheDocument();
  });

  it('calls onConfirm when the confirm button is clicked', () => {
    const onConfirm = jest.fn();
    render(
      <ConfirmDialog open title="T" message="M" onConfirm={onConfirm} onCancel={jest.fn()} />,
    );
    fireEvent.click(screen.getByText('Confirmar'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when the cancel button is clicked', () => {
    const onCancel = jest.fn();
    render(
      <ConfirmDialog open title="T" message="M" onConfirm={jest.fn()} onCancel={onCancel} />,
    );
    fireEvent.click(screen.getByText('Cancelar'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when the overlay is clicked', () => {
    const onCancel = jest.fn();
    const { container } = render(
      <ConfirmDialog open title="T" message="M" onConfirm={jest.fn()} onCancel={onCancel} />,
    );
    fireEvent.click(container.firstChild as HTMLElement);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
