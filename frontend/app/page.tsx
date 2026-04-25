import Link from 'next/link';
import Image from 'next/image';

const categorias = [
  { nombre: 'Chocolate', imagen: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=300&h=300&fit=crop' },
  { nombre: 'Vainilla', imagen: 'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=300&h=300&fit=crop' },
  { nombre: 'Frutas', imagen: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=300&h=300&fit=crop' },
  { nombre: 'Personalizado', imagen: 'https://images.unsplash.com/photo-1558301211-0d8c8ddee6ec?w=300&h=300&fit=crop' },
];

export default function Home() {
  return (
    <main>
      {/* Hero Section */}
      <section style={{
        position: 'relative',
        height: '85vh',
        minHeight: 600,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to right, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.1) 100%)',
          zIndex: 1
        }} />
        <Image
          src="https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=1920&h=1080&fit=crop"
          alt="Pastel elegante"
          fill
          style={{ objectFit: 'cover', objectPosition: 'center' }}
          priority
        />
        <div style={{
          position: 'relative',
          zIndex: 2,
          textAlign: 'center',
          color: '#fff',
          maxWidth: 700,
          padding: '0 2rem'
        }}>
          <p style={{
            fontFamily: 'Georgia, serif',
            fontSize: '0.9rem',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            marginBottom: '1rem',
            opacity: 0.9
          }}>
            Pasteles Artesanales
          </p>
          <h1 style={{
            fontFamily: 'Georgia, serif',
            fontSize: 'clamp(3rem, 8vw, 5rem)',
            fontWeight: 400,
            marginBottom: '1.5rem',
            lineHeight: 1.1
          }}>
            Dolce Atelier
          </h1>
          <p style={{
            fontSize: '1.2rem',
            marginBottom: '2rem',
            opacity: 0.9,
            fontWeight: 300
          }}>
            Elaborados con amor, ingredientes premium y la más alta calidad
          </p>
          <Link href="/catalogo" style={{
            display: 'inline-block',
            padding: '1rem 2.5rem',
            background: '#E11D48',
            color: '#fff',
            borderRadius: '4px',
            textDecoration: 'none',
            fontWeight: 500,
            fontSize: '0.95rem',
            letterSpacing: '0.05em',
            transition: 'background 0.3s'
          }}>
            Ver Catálogo
          </Link>
        </div>
        <div style={{
          position: 'absolute',
          bottom: '2rem',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 2,
          color: '#fff',
          opacity: 0.7,
          fontSize: '1.5rem',
          animation: 'bounce 2s infinite'
        }}>
          ↓
        </div>
      </section>

      {/* Categorías */}
      <section style={{ padding: '5rem 2rem', background: '#faf9f8' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <p style={{
              fontFamily: 'Georgia, serif',
              fontSize: '0.85rem',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: '#E11D48',
              marginBottom: '0.5rem'
            }}>
              Nuestros Sabores
            </p>
            <h2 style={{
              fontFamily: 'Georgia, serif',
              fontSize: '2.5rem',
              fontWeight: 400,
              color: '#1a1a1a'
            }}>
              Categorías
            </h2>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '2rem'
          }}>
            {categorias.map((cat) => (
              <Link
                key={cat.nombre}
                href={`/catalogo?categoria=${cat.nombre.toLowerCase()}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textDecoration: 'none',
                  color: 'inherit'
                }}
              >
                <div style={{
                  width: 180,
                  height: 180,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  marginBottom: '1rem',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                  transition: 'transform 0.3s, box-shadow 0.3s',
                  position: 'relative'
                }}>
                  <Image
                    src={cat.imagen}
                    alt={cat.nombre}
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <h3 style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: '1.25rem',
                  fontWeight: 400,
                  color: '#1a1a1a'
                }}>
                  {cat.nombre}
                </h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Por qué nosotros */}
      <section style={{ padding: '5rem 2rem', background: '#fff' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '3rem'
          }}>
            {[
              {
                titulo: 'Artesanales',
                desc: 'Cada pastel es elaborado a mano con dedicación y cuidado artesanal.',
                icono: '✦'
              },
              {
                titulo: 'Ingredientes Premium',
                desc: 'Solo usamos chocolate belga, vainilla natural y frutas frescas.',
                icono: '✦'
              },
              {
                titulo: 'Personalización',
                desc: 'Envíanos tu receta o idea y la convertiremos en realidad.',
                icono: '✦'
              },
            ].map((item) => (
              <div key={item.titulo} style={{ textAlign: 'center' }}>
                <span style={{
                  display: 'inline-block',
                  color: '#E11D48',
                  fontSize: '1.5rem',
                  marginBottom: '1rem'
                }}>
                  {item.icono}
                </span>
                <h3 style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: '1.5rem',
                  fontWeight: 400,
                  marginBottom: '0.75rem',
                  color: '#1a1a1a'
                }}>
                  {item.titulo}
                </h3>
                <p style={{ color: '#666', lineHeight: 1.7 }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Recetas */}
      <section style={{
        padding: '5rem 2rem',
        background: 'linear-gradient(135deg, #fdf5f5 0%, #fff 100%)',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <p style={{
            fontFamily: 'Georgia, serif',
            fontSize: '0.85rem',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: '#E11D48',
            marginBottom: '0.5rem'
          }}>
            Something Special
          </p>
          <h2 style={{
            fontFamily: 'Georgia, serif',
            fontSize: '2rem',
            fontWeight: 400,
            marginBottom: '1rem',
            color: '#1a1a1a'
          }}>
            ¿Tienes una receta especial?
          </h2>
          <p style={{ color: '#666', marginBottom: '2rem', lineHeight: 1.7 }}>
            Envíanos tu receta personalizada y te cotizaremos un pastel único hecho especialmente para ti.
          </p>
          <Link href="/recetas" style={{
            display: 'inline-block',
            padding: '1rem 2rem',
            background: '#E11D48',
            color: '#fff',
            borderRadius: '4px',
            textDecoration: 'none',
            fontWeight: 500
          }}>
            Solicitar Cotización
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '4rem 2rem',
        background: '#1a1a1a',
        color: '#fff'
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '3rem',
            marginBottom: '3rem'
          }}>
            <div>
              <h3 style={{
                fontFamily: 'Georgia, serif',
                fontSize: '1.5rem',
                fontWeight: 400,
                marginBottom: '1rem'
              }}>
                Dolce Atelier
              </h3>
              <p style={{ color: '#999', fontSize: '0.9rem', lineHeight: 1.7 }}>
                Pasteles artesanales elaborados con amor y los mejores ingredientes.
              </p>
            </div>
            <div>
              <h4 style={{ fontSize: '0.9rem', letterSpacing: '0.1em', marginBottom: '1rem', color: '#999' }}>
                HORARIO
              </h4>
              <p style={{ color: '#fff', fontSize: '0.9rem' }}>Lun - Vie: 8:00 AM - 7:00 PM</p>
              <p style={{ color: '#fff', fontSize: '0.9rem' }}>Sábados: 9:00 AM - 5:00 PM</p>
            </div>
            <div>
              <h4 style={{ fontSize: '0.9rem', letterSpacing: '0.1em', marginBottom: '1rem', color: '#999' }}>
                CONTACTO
              </h4>
              <p style={{ color: '#fff', fontSize: '0.9rem' }}>Av. Principal #123</p>
              <p style={{ color: '#fff', fontSize: '0.9rem' }}>Ciudad, México</p>
              <p style={{ color: '#E11D48', fontSize: '0.9rem', marginTop: '0.5rem' }}>+52 55 1234 5678</p>
            </div>
          </div>
          <div style={{
            borderTop: '1px solid #333',
            paddingTop: '2rem',
            textAlign: 'center',
            color: '#666',
            fontSize: '0.85rem'
          }}>
            © 2026 Dolce Atelier. Todos los derechos reservados.
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateX(-50%) translateY(0); }
          40% { transform: translateX(-50%) translateY(-10px); }
          60% { transform: translateX(-50%) translateY(-5px); }
        }
        a:hover > div:first-child {
          transform: scale(1.05);
          box-shadow: 0 15px 50px rgba(0,0,0,0.15) !important;
        }
      `}</style>
    </main>
  );
}