import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Mail, MessageCircle, Send, CheckCircle2 } from 'lucide-react';

import './ContactPage.css';

const ContactPage = () => {
  const [selectedType, setSelectedType] = useState(null); // 'ventas', 'soporte', 'whatsapp'
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleCardClick = (type) => {
    setSelectedType(type);
    setSubmitted(false);
    // Pre-fill subject based on type
    const subjects = {
      ventas: 'Consulta de Ventas',
      soporte: 'Solicitud de Soporte Técnico',
      whatsapp: 'Consulta vía WhatsApp'
    };
    setFormState(prev => ({ ...prev, subject: subjects[type] }));
  };

  const handleChange = (e) => {
    setFormState({ ...formState, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (selectedType === 'whatsapp') {
      const waNumber = '+593999046647';
      const text = `Hola Banana Computer! Mi nombre es ${formState.name}. \n${formState.message}`;
      const encodedText = encodeURIComponent(text);
      window.open(`https://wa.me/${waNumber}?text=${encodedText}`, '_blank');
      setSubmitted(true);
    } else {
      // Simulate email submission
      console.log(`Sending email to ${selectedType === 'ventas' ? 'ventas@banana-computer.com' : 'soporte@banana-computer.com'}`, formState);
      setSubmitted(true);
    }
  };

  return (
    <div className="contact-root">
      <Header />
      
      <main className="contact-page">
        <header className="contact-header">
          <h1 className="contact-title">Contacto</h1>
          <p className="contact-subtitle">Selecciona el departamento con el que deseas comunicarte</p>
        </header>

        <section className="contact-options">
          {/* Opción Ventas */}
          <div 
            className={`contact-card ${selectedType === 'ventas' ? 'active' : ''}`}
            onClick={() => handleCardClick('ventas')}
          >
            <div className="contact-card-icon"><Mail size={40} /></div>
            <h3 className="contact-card-title">Ventas</h3>
            <p className="contact-card-desc">Escríbenos para consultas sobre productos, precios y disponibilidad.</p>
          </div>

          {/* Opción Soporte */}
          <div 
            className={`contact-card ${selectedType === 'soporte' ? 'active' : ''}`}
            onClick={() => handleCardClick('soporte')}
          >
            <div className="contact-card-icon"><Mail size={40} /></div>
            <h3 className="contact-card-title">Soporte</h3>
            <p className="contact-card-desc">Asistencia técnica para tus equipos y consultas sobre garantías.</p>
          </div>

          {/* Opción WhatsApp */}
          <div 
            className={`contact-card ${selectedType === 'whatsapp' ? 'active' : ''}`}
            onClick={() => handleCardClick('whatsapp')}
          >
            <div className="contact-card-icon"><MessageCircle size={40} /></div>
            <h3 className="contact-card-title">Ventas WhatsApp</h3>
            <p className="contact-card-desc">Comunicación directa con un asesor de ventas vía WhatsApp.</p>
          </div>
        </section>

        {selectedType && (
          <section className="contact-form-container">
            {submitted ? (
              <div className="success-message">
                <span className="success-icon"><CheckCircle2 size={60} /></span>
                <h2 className="contact-form-title">¡Mensaje Enviado!</h2>
                <p>Gracias por contactarnos, {formState.name}. Nos comunicaremos contigo muy pronto.</p>
                <button 
                  className="btn-submit" 
                  style={{ marginTop: '2rem' }}
                  onClick={() => { setSelectedType(null); setSubmitted(false); }}
                >
                  Volver a opciones
                </button>
              </div>
            ) : (
              <>
                <h2 className="contact-form-title">
                  {selectedType === 'whatsapp' ? 'Formulario WhatsApp' : `Enviar Email a ${selectedType === 'ventas' ? 'Ventas' : 'Soporte'}`}
                </h2>
                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label htmlFor="name">Nombre Completo</label>
                    <input 
                      type="text" 
                      id="name" 
                      name="name" 
                      className="form-input"
                      placeholder="Ej. Juan Pérez"
                      required
                      value={formState.name}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Correo Electrónico</label>
                    <input 
                      type="email" 
                      id="email" 
                      name="email" 
                      className="form-input"
                      placeholder="tu@email.com"
                      required
                      value={formState.email}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="subject">Asunto</label>
                    <input 
                      type="text" 
                      id="subject" 
                      name="subject" 
                      className="form-input"
                      required
                      value={formState.subject}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="message">Mensaje</label>
                    <textarea 
                      id="message" 
                      name="message" 
                      className="form-textarea"
                      placeholder="¿En qué podemos ayudarte?"
                      required
                      value={formState.message}
                      onChange={handleChange}
                    ></textarea>
                  </div>
                  <button type="submit" className="btn-submit">
                    {selectedType === 'whatsapp' ? 'Continuar a WhatsApp' : 'Enviar Mensaje'}
                  </button>
                </form>
              </>
            )}
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
};


export default ContactPage;
