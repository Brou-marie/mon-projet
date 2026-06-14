/**
 * Disposition principale qui englobe toutes les pages publiques et privées.
 */
import React from 'react'
import { Outlet } from 'react-router-dom'
import { Entete } from './Entete'
import { PiedDePage } from './PiedDePage'

export function DispositionPrincipale() {
  return (
    <div className="min-h-screen flex flex-col">
      <Entete />
      <main className="flex-1">
        <Outlet />
      </main>
      <PiedDePage />
    </div>
  )
}
