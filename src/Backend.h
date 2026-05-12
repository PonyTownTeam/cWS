#ifndef BACKEND_H
#define BACKEND_H

#if defined(__linux__) && !defined(USE_LIBUV)
	#ifndef USE_EPOLL
		#define USE_EPOLL
	#endif
	
	#define EVENT_READABLE EPOLLIN
	#define EVENT_WRITABLE EPOLLOUT

	#include "Epoll.h"
#else
	#define EVENT_READABLE UV_READABLE
	#define EVENT_WRITABLE UV_WRITABLE

	#include "Libuv.h"
#endif

#endif // BACKEND_H
