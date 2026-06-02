import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import OptimizedImage from '@/shared/components/OptimizedImage.vue'

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  unobserve: vi.fn(),
}))

// Mock canvas for WebP support detection
global.HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/webp;base64,')

describe('OptimizedImage', () => {
  let wrapper

  beforeEach(() => {
    vi.clearAllMocks()
  })

  const defaultProps = {
    src: 'https://example.com/image.jpg',
    alt: 'Test image'
  }

  it('should render with required props', () => {
    wrapper = mount(OptimizedImage, {
      props: defaultProps
    })

    expect(wrapper.find('.optimized-image').exists()).toBe(true)
    expect(wrapper.find('img').attributes('alt')).toBe('Test image')
  })

  it('should show loading state initially', () => {
    wrapper = mount(OptimizedImage, {
      props: defaultProps
    })

    expect(wrapper.find('.optimized-image--loading').exists()).toBe(true)
    expect(wrapper.find('.optimized-image__skeleton').exists()).toBe(true)
  })

  it('should show error state when image fails to load', async () => {
    wrapper = mount(OptimizedImage, {
      props: defaultProps
    })

    const img = wrapper.find('img')
    await img.trigger('error')

    expect(wrapper.find('.optimized-image--error').exists()).toBe(true)
    expect(wrapper.find('.optimized-image__error').exists()).toBe(true)
  })

  it('should show loaded state when image loads successfully', async () => {
    wrapper = mount(OptimizedImage, {
      props: defaultProps
    })

    const img = wrapper.find('img')
    await img.trigger('load')

    expect(wrapper.find('.optimized-image--loaded').exists()).toBe(true)
    expect(wrapper.find('.optimized-image__skeleton').exists()).toBe(false)
  })

  it('should emit load event when image loads', async () => {
    wrapper = mount(OptimizedImage, {
      props: defaultProps
    })

    const img = wrapper.find('img')
    await img.trigger('load')

    expect(wrapper.emitted('load')).toBeTruthy()
  })

  it('should emit error event when image fails', async () => {
    wrapper = mount(OptimizedImage, {
      props: defaultProps
    })

    const img = wrapper.find('img')
    await img.trigger('error')

    expect(wrapper.emitted('error')).toBeTruthy()
  })

  it('should apply custom dimensions', () => {
    wrapper = mount(OptimizedImage, {
      props: {
        ...defaultProps,
        width: 200,
        height: 150
      }
    })

    const container = wrapper.find('.optimized-image')
    const style = container.attributes('style')
    
    expect(style).toContain('width: 200px')
    expect(style).toContain('height: 150px')
  })

  it('should apply aspect ratio', () => {
    wrapper = mount(OptimizedImage, {
      props: {
        ...defaultProps,
        aspectRatio: '16/9'
      }
    })

    const container = wrapper.find('.optimized-image')
    const style = container.attributes('style')
    
    expect(style).toContain('aspect-ratio: 16/9')
  })

  it('should use eager loading when specified', () => {
    wrapper = mount(OptimizedImage, {
      props: {
        ...defaultProps,
        loading: 'eager'
      }
    })

    const img = wrapper.find('img')
    expect(img.attributes('loading')).toBe('eager')
  })

  it('should render custom error slot', () => {
    wrapper = mount(OptimizedImage, {
      props: defaultProps,
      slots: {
        error: '<div class="custom-error">Custom error message</div>'
      }
    })

    // Trigger error
    const img = wrapper.find('img')
    img.trigger('error')

    expect(wrapper.find('.custom-error').exists()).toBe(true)
  })

  it('should render overlay slot when provided', () => {
    wrapper = mount(OptimizedImage, {
      props: defaultProps,
      slots: {
        overlay: '<div class="custom-overlay">Overlay content</div>'
      }
    })

    expect(wrapper.find('.optimized-image__overlay').exists()).toBe(true)
    expect(wrapper.find('.custom-overlay').exists()).toBe(true)
  })

  it('should generate WebP source when supported', () => {
    wrapper = mount(OptimizedImage, {
      props: {
        ...defaultProps,
        formats: ['webp', 'jpg']
      }
    })

    const sources = wrapper.findAll('source')
    const webpSource = sources.find(source => 
      source.attributes('type') === 'image/webp'
    )
    
    expect(webpSource).toBeTruthy()
  })

  it('should generate responsive srcset', () => {
    wrapper = mount(OptimizedImage, {
      props: {
        ...defaultProps,
        width: 400
      }
    })

    const img = wrapper.find('img')
    const srcset = img.attributes('srcset')
    
    // Should contain multiple sizes
    expect(srcset).toContain('150w')
    expect(srcset).toContain('400w')
    expect(srcset).toContain('800w')
  })
})