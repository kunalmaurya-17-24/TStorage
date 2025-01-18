import React from 'react'

const Modal = ({ children, onClose }) => {
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-900"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  )
}

export default Modal