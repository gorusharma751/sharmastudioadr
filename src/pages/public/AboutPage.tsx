import React from 'react';
import { motion } from 'framer-motion';
import { Camera, Award, Users, Heart, Clock, Star } from 'lucide-react';
import GlassNavbar from '@/components/GlassNavbar';
import Footer from '@/components/Footer';
import { SectionContainer, SectionHeader } from '@/components/ui/shared';
import { useStudio } from '@/contexts/StudioContext';

const stats = [
  { icon: Camera, label: 'Projects Completed', value: '500+' },
  { icon: Users, label: 'Happy Clients', value: '300+' },
  { icon: Award, label: 'Years Experience', value: '10+' },
  { icon: Star, label: 'Five Star Reviews', value: '200+' },
];

const AboutPage: React.FC = () => {
  const { studio, settings } = useStudio();

  return (
    <div className="min-h-screen bg-background">
      <GlassNavbar studioName={studio?.name || 'Studio'} logoUrl={settings?.logo_url || undefined} studioSlug={studio?.slug} studioId={studio?.id} />
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="pt-32 pb-20"
      >
        {/* Hero Section */}
        <SectionContainer>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
                Capturing Your{' '}
                <span className="text-gradient">Precious Moments</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                {studio?.name || 'Our studio'} is dedicated to capturing the most beautiful moments of your life. 
                With years of experience in wedding photography and videography, we bring artistry, 
                passion, and technical excellence to every project.
              </p>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 text-primary">
                  <Heart size={20} />
                  <span>Passion for Perfection</span>
                </div>
                <div className="flex items-center gap-2 text-primary">
                  <Clock size={20} />
                  <span>Always On Time</span>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="relative"
            >
              <div className="aspect-[4/5] rounded-2xl overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=800&q=80"
                  alt="Studio team"
                  className="w-full h-full object-cover"
                />
              </div>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
                className="absolute -bottom-6 -left-6 glass-card p-6"
              >
                <div className="text-3xl font-bold text-primary">10+</div>
                <div className="text-sm text-muted-foreground">Years of Excellence</div>
              </motion.div>
            </motion.div>
          </div>
        </SectionContainer>

        {/* Stats Section */}
        <section className="py-20 bg-charcoal mt-20">
          <SectionContainer>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 + 0.2 }}
                  className="text-center"
                >
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="w-16 h-16 mx-auto mb-4 rounded-xl bg-primary/20 flex items-center justify-center"
                  >
                    <stat.icon className="text-primary" size={28} />
                  </motion.div>
                  <div className="font-display text-3xl font-bold text-foreground mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </SectionContainer>
        </section>

        {/* Our Story */}
        <section className="py-20">
          <SectionContainer>
            <SectionHeader
              title="Our Story"
              subtitle="A journey of passion, creativity, and countless beautiful memories"
            />
            
            <div className="max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="prose prose-invert prose-lg mx-auto"
              >
                <div className="glass-card p-8 md:p-12">
                  <p className="text-muted-foreground leading-relaxed mb-6">
                    Founded with a vision to redefine wedding photography in India, {studio?.name || 'our studio'} 
                    has grown from a small team of passionate photographers to one of the most sought-after 
                    studios in the region.
                  </p>
                  <p className="text-muted-foreground leading-relaxed mb-6">
                    We believe that every love story is unique, and our mission is to capture the essence 
                    of your relationship in a way that is authentic, beautiful, and timeless. From the 
                    grand celebrations to the quiet, intimate moments, we're there to document it all.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    Our team brings together diverse talents in photography, videography, editing, and 
                    design to deliver comprehensive coverage that exceeds expectations. We invest in the 
                    latest technology and continuously refine our craft to bring you the best possible results.
                  </p>
                </div>
              </motion.div>
            </div>
          </SectionContainer>
        </section>

        {/* Values */}
        <section className="py-20 bg-charcoal">
          <SectionContainer>
            <SectionHeader
              title="Our Values"
              subtitle="The principles that guide everything we do"
            />
            
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: 'Excellence',
                  description: 'We strive for perfection in every shot, every edit, and every delivery.',
                  icon: Award,
                },
                {
                  title: 'Creativity',
                  description: 'We bring fresh perspectives and artistic vision to capture your story uniquely.',
                  icon: Camera,
                },
                {
                  title: 'Reliability',
                  description: 'Count on us to be there when you need us, delivering on time, every time.',
                  icon: Clock,
                },
              ].map((value, index) => (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="glass-card p-8 text-center"
                >
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="w-16 h-16 mx-auto mb-6 rounded-xl bg-primary/20 flex items-center justify-center"
                  >
                    <value.icon className="text-primary" size={28} />
                  </motion.div>
                  <h3 className="font-display text-xl font-semibold mb-4">{value.title}</h3>
                  <p className="text-muted-foreground">{value.description}</p>
                </motion.div>
              ))}
            </div>
          </SectionContainer>
        </section>
      </motion.div>
      
      <Footer studioName={studio?.name || 'Studio'} logoUrl={settings?.logo_url || undefined} settings={settings} studioSlug={studio?.slug} />
    </div>
  );
};

export default AboutPage;
