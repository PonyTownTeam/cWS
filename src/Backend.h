#ifndef BACKEND_H
#define BACKEND_H

// Default to Epoll if nothing specified and on Linux
// Default to Libuv if nothing specified and not on Linux
#if defined(__linux__)
	#ifndef USE_EPOLL
		#define USE_EPOLL
	#endif
	#include "Epoll.h"
#else
	#include "Libuv.h"
#endif

#endif // BACKEND_H
