"use client";
import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Mail, MessageCircle, Send, CheckCircle2, ChevronRight, MessageSquare } from 'lucide-react';

export default function ContactPage() {
  const [selectedType, setSelectedType] = useState(null); // 'ventas', 'soporte', 'whatsapp'
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleCardClick = (type) => {
    setSelectedType(type);
    setSubmitted(false);
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
      console.log(`Sending email...`, formState);
      setSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen bg-cream-bg">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 pt-32 pb-20">
        <header className="mb-16 text-center flex flex-col items-center">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4">Contacto Directo</h1>
          <p className="text-gray-500 font-medium max-w-xl">
            Estamos listos para impulsarte. Selecciona el canal de comunicación que mejor se adapte a tus necesidades.
          </p>
          <div className="h-1 bg-banana-yellow w-24 mt-8"></div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          <ContactCard 
            active={selectedType === 'ventas'}
            onClick={() => handleCardClick('ventas')}
            icon={<Mail size={32} />}
            title="Ventas"
            desc="Consultas sobre productos, precios corporativos y disponibilidad inmediata."
          />
          <ContactCard 
            active={selectedType === 'soporte'}
            onClick={() => handleCardClick('soporte')}
            icon={<MessageSquare size={32} />}
            title="Soporte"
            desc="Asistencia técnica especializada y gestión ágil de garantías oficiales."
          />
          <ContactCard 
            active={selectedType === 'whatsapp'}
            onClick={() => handleCardClick('whatsapp')}
            icon={<MessageCircle size={32} />}
            title="WhatsApp Sales"
            desc="Conexión instantánea con un asesor para una compra guiada y segura."
            variant="banana"
          />
        </section>

        {selectedType && (
          <section className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-[2.5rem] p-10 border border-black/5 shadow-2xl shadow-black/5 relative overflow-hidden">
              {submitted ? (
                <div className="text-center py-10 flex flex-col items-center gap-6">
                  <div className="w-20 h-20 bg-mint-success text-white rounded-full flex items-center justify-center shadow-lg shadow-mint-success/20">
                    <CheckCircle2 size={40} />
                  </div>
                  <h2 className="text-3xl font-black tracking-tight">¡Mensaje Recibido!</h2>
                  <p className="text-gray-500 font-medium">Gracias {formState.name}, nos comunicaremos contigo a la brevedad posible.</p>
                  <button 
                    className="mt-6 px-10 py-4 bg-gray-100 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-colors"
                    onClick={() => { setSelectedType(null); setSubmitted(false); }}
                  >
                    Volver a opciones
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-black mb-8 flex items-center gap-3">
                    <span className="w-2 h-8 bg-purple-brand rounded-full"></span>
                    {selectedType === 'whatsapp' ? 'Iniciar Chat de Ventas' : `Enviar Mensaje a ${selectedType === 'ventas' ? 'Ventas' : 'Soporte'}`}
                  </h2>
                  <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Nombre Completo</label>
                        <input 
                          type="text" 
                          name="name" 
                          className="w-full bg-gray-50 border border-black/5 rounded-2xl px-5 py-4 text-sm font-medium outline-none focus:border-purple-brand/30 transition-all"
                          placeholder="Juan Pérez"
                          required
                          value={formState.name}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Email de Contacto</label>
                        <input 
                          type="email" 
                          name="email" 
                          className="w-full bg-gray-50 border border-black/5 rounded-2xl px-5 py-4 text-sm font-medium outline-none focus:border-purple-brand/30 transition-all"
                          placeholder="tu@email.com"
                          required
                          value={formState.email}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Asunto de la Consulta</label>
                      <input 
                        type="text" 
                        name="subject" 
                        className="w-full bg-gray-50 border border-black/5 rounded-2xl px-5 py-4 text-sm font-medium outline-none focus:border-purple-brand/30 transition-all"
                        required
                        value={formState.subject}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Tu Mensaje</label>
                      <textarea 
                        name="message" 
                        rows="5"
                        className="w-full bg-gray-50 border border-black/5 rounded-2xl px-5 py-4 text-sm font-medium outline-none focus:border-purple-brand/30 transition-all resize-none"
                        placeholder="Escríbenos detalladamente cómo podemos ayudarte..."
                        required
                        value={formState.message}
                        onChange={handleChange}
                      ></textarea>
                    </div>
                    <button type="submit" className="w-full py-5 bg-purple-brand text-white rounded-2xl font-black text-lg hover:scale-102 active:scale-95 transition-all shadow-xl shadow-purple-brand/20">
                      {selectedType === 'whatsapp' ? 'Continuar a WhatsApp Oficial' : 'Enviar Mensaje Ahora'}
                    </button>
                  </form>
                </>
              )}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}

function ContactCard({ active, onClick, icon, title, desc, variant = 'purple' }) {
  const styles = {
    purple: 'text-purple-brand group-hover:bg-purple-brand group-hover:text-white',
    banana: 'text-banana-yellow group-hover:bg-banana-yellow group-hover:text-black'
  };

  return (
    <div 
      className={`
        group p-10 bg-white rounded-[2.5rem] border transition-all cursor-pointer flex flex-col gap-6
        ${active ? 'border-purple-brand ring-4 ring-purple-brand/5 -translate-y-2' : 'border-black/5 hover:border-black/10 hover:-translate-y-2'}
      `}
      onClick={onClick}
    >
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all bg-gray-50 ${styles[variant]}`}>
        {icon}
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="text-2xl font-black">{title}</h3>
        <p className="text-sm text-gray-400 font-medium leading-relaxed">{desc}</p>
      </div>
      <div className="mt-auto flex items-center justify-between">
        <span className="text-[10px] font-black tracking-widest uppercase opacity-40 group-hover:opacity-100 transition-opacity">Seleccionar canal</span>
        <ChevronRight size={16} className={`transition-transform group-hover:translate-x-1 ${variant === 'banana' ? 'text-banana-yellow' : 'text-purple-brand'}`} />
      </div>
    </div>
  );
}
